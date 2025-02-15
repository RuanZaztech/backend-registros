import cron from 'node-cron'; 
import { websocket, recebeWebSocket } from './WebSocket.js';


export default async function chamandoCron (prisma, app) {
    cron.schedule('*/10 * * * * *', async () => {
        const agoraBrasil = new Date().toLocaleString('sv-SE', { timeZone: 'America/Sao_Paulo' }).replace(' ', 'T') + '.000Z';

        console.log(agoraBrasil)
        const tarefas = await prisma.registros.findMany({
            where: { 
                scheduled_at: { 
                lt: agoraBrasil,
                not: null,
                },
            }
        })
    
        if(tarefas.length <= 0) {
            console.log('Vazio')
            return false;
        }
    
        manipulaAgendamento(tarefas)
    })
    
    async function manipulaAgendamento (arr) {
        for (const Data of arr) {
            try {
                const response = await websocket(Data); 

                let retornoWS = response.retorno;
                let acao = response.acao ;
                
                if(retornoWS === 'stop') {
                    const attregistro = await prisma.registros.update({
                        where: { 'id': Data.id },
                        data: { 
                            is_open: String(acao),
                            scheduled_at: null
                        },
                    });

                    console.warn(attregistro);
                    const nome = attregistro.name;
                    const acaoWh = attregistro.acao == '1' ? 'aberto' : 'fechado';
                    recebeWebSocket(nome, acaoWh);
                }
            } catch (error) {
                console.error('Erro ao enviar mensagem:', error);
            }
        }
    }
}