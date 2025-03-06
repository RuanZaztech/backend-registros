import { createRegistroEsp } from './Api.js';

export async function websocket (el) {
    return new Promise(async (resolve, reject) => {
        const comando = el?.is_open === '1' ? 0 : 1;

        const data = {
            comando
        }

        try {
            const result = await createRegistroEsp(`/enviar-comando/${el.ip_placa}`, data);
            if(result.resposta === 'stop') {
                resolve({'retorno': result.resposta, 'acao': comando});
            }
        } catch (err) {
            reject(err);
        }
    })
}