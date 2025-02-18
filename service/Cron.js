import cron from 'node-cron'; 
import { websocket } from './WebSocket.js';
import { sendTokenToServer } from './pushNotification.js';


export default async function chamandoCron (prisma, app) {
    cron.schedule('*/10 * * * * *', async () => {
        const agoraBrasil = new Date().toLocaleString('sv-SE', { timeZone: 'America/Sao_Paulo' }).replace(' ', 'T') + '.000Z';

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

                    const nome = attregistro.name;
                    const acaoWh = attregistro.acao == '1' ? 'aberto' : 'fechado';
                    sendTokenToServer(nome, acaoWh, prisma)
                }
            } catch (error) {
                console.error('Erro ao enviar mensagem:', error);
            }
        }
    }
}