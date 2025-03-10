import express from "express";
import { Router } from "express";
import { WebSocketServer } from "ws";

const router = Router();

router.use(express.json());

const portEsp = [8080];
const wssInstances = {};

portEsp.forEach(porta => {
    wssInstances[porta] = iniciaConexaoComPlaca(porta);
});

console.log(wssInstances)

function iniciaConexaoComPlaca(porta) {
    const wss = new WebSocketServer({ port: porta });

    let esp32Socket = null;
    let waitingResponses = new Map();

    wss.on("connection", function connection(ws) {
        console.log(`Cliente (ESP32) conectado na porta ${porta}`);
        esp32Socket = ws;

        ws.on("message", function incoming(message) {
            message = message.toString();
            console.log(`Mensagem recebida da ESP32 na porta ${porta}:`, message);

            if (waitingResponses.size > 0) {
                const [key, resolve] = waitingResponses.entries().next().value;
                resolve({ status: "Comando executado pela ESP32", resposta: message });
                waitingResponses.delete(key);
            }
        });

        ws.on("close", () => {
            console.log(`Cliente (ESP32) desconectado da porta ${porta}`);
            esp32Socket = null;
        });
    });

    function enviarComandoEEsperar(comando) {
        return new Promise((resolve, reject) => {
            if (!esp32Socket) {
                return reject({ error: "ESP32 não está conectada" });
            }

            console.log(`Enviando para ESP32 (porta ${porta}): ${comando}`);
            esp32Socket.send(comando.toString());

            const requestId = Date.now();
            waitingResponses.set(requestId, resolve);

            setTimeout(() => {
                if (waitingResponses.has(requestId)) {
                    waitingResponses.delete(requestId);
                    reject({ error: "Tempo limite para resposta da ESP32 excedido" });
                }
            }, 10000);
        });
    }

    return { enviarComandoEEsperar };
}

// Rota HTTP que recebe comandos e aguarda a resposta da ESP32
router.post("/enviar-comando/:porta", async (req, res) => {
    const { comando } = req.body;
    const { porta } = req.params;

    console.log(`Rota acionada: /enviar-comando/${porta} com comando ${comando}`);

    if (comando !== 0 && comando !== 1) {
        return res.status(400).json({ error: "Comando inválido. Use 0 ou 1." });
    }

    if (!wssInstances[porta]) {
        return res.status(404).json({ error: `Nenhum WebSocket rodando na porta ${porta}` });
    }

    try {
        const resposta = await wssInstances[porta].enviarComandoEEsperar(comando);
        res.json(resposta);
    } catch (error) {
        res.status(500).json(error);
    }
});

export default router;
