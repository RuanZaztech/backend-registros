import WebSocket from 'ws';

export default async function websocket (el) {
    return new Promise((resolve, reject) => {
        const ws = new WebSocket(`ws://${el?.ip_placa}`);
        const acao = el?.is_open === '1' ? '0' : '1';
        
        ws.on('open', () => {
            ws.send(acao);
        });

        ws.onmessage = (Data) => {
            let data = Data.data;
            console.log('resolve', data)
            if(data === 'stop') {
                resolve({'retorno': data, 'acao': acao});
                ws.close()
            }
        }

        ws.on('error', (error) => {
            ws.close()
            reject(error); // Se houver erro, rejeite a promessa
        });
    })
}