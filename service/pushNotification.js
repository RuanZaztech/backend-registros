export async function sendTokenToServer(nome, acao) {
    fetch('http://192.168.15.3:3000/send-notification', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            token: 'ExponentPushToken[8drkt4KKTNEenZzT8Md7DN]',
            title: 'Agendamento concluído',
            body: `O ${nome} foi ${acao} com sucesso!`,
        }),
    });
}