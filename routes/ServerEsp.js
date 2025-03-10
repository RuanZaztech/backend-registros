import express from "express";
import { Router } from "express";
import { WebSocketServer } from "ws";

const router = Router();

// Middleware para aceitar JSON no corpo da requisição
router.use(express.json());

// Criação do servidor WebSocket
const portEsp = [8080];

portEsp.forEach(el => {
    iniciaConexaoComPlaca(el)
})

function iniciaConexaoComPlaca (porta) {
    console.log(porta)
    const wss = new WebSocketServer({ port: porta });
    
    let esp32Socket = null; // Variável para armazenar a conexão com a ESP32
    let waitingResponses = new Map(); // Armazena as promessas pendentes (esperando resposta da ESP32)
    
    // Quando a ESP32 se conectar ao WebSocket
    wss.on('connection', function connection(ws) {
        console.log('Cliente (ESP32) conectado');
        esp32Socket = ws;
    
        // Quando a ESP32 enviar uma mensagem
        ws.on('message', function incoming(message) {
            message = message.toString();
            console.log('Mensagem recebida da ESP32:', message);
    
            // Verifica se há alguma requisição esperando resposta
            if (waitingResponses.size > 0) {
                const [key, resolve] = waitingResponses.entries().next().value;
                resolve({ status: 'Comando executado pela ESP32', resposta: message });
                waitingResponses.delete(key);
            }
        });
    
        // Quando a ESP32 se desconectar
        ws.on('close', () => {
            console.log('Cliente (ESP32) desconectado');
            esp32Socket = null;
        });
    });
    
    // Função para enviar um comando para a ESP32 e aguardar resposta
    function enviarComandoEEsperar(comando) {
        return new Promise((resolve, reject) => {
            if (!esp32Socket) {
                return reject({ error: 'ESP32 não está conectada' });
            }
    
            console.log(`Enviando para ESP32: ${comando}`);
            esp32Socket.send(comando.toString());
    
            // Gera um ID único para a requisição
            const requestId = Date.now();
            waitingResponses.set(requestId, resolve);
    
            // Timeout de segurança caso a ESP32 não responda
            setTimeout(() => {
                if (waitingResponses.has(requestId)) {
                    waitingResponses.delete(requestId);
                    reject({ error: 'Tempo limite para resposta da ESP32 excedido' });
                }
            }, 10000); // Tempo limite de 10 segundos
        });
    }
    
    // Rota HTTP que recebe comandos externos e aguarda a resposta da ESP32
    router.post(`/enviar-comando/${porta}`, async (req, res) => {
        const { comando } = req.body;
    
        if (comando !== 0 && comando !== 1) {
            return res.status(400).json({ error: 'Comando inválido. Use 0 ou 1.' });
        }
    
        try {
            // Aguarda a resposta da ESP32 antes de retornar ao cliente
            const resposta = await enviarComandoEEsperar(comando);
            res.json(resposta);
        } catch (error) {
            res.status(500).json(error);
        }
    });
}

export default router;
