export async function sendTokenToServer(nome, acao, prisma) {

    const allTokens = await prisma.tokens.findMany({});
    
    allTokens.forEach(el => {
        fetch('https://srv737240.hstgr.cloud/send-notification', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                token: el.token,
                sound: "sound",
                title: 'Agendamento concluído',
                body: `O ${nome.replace('_', ' ').toUpperCase()} foi ${acao} com sucesso!`,
            }),
        });
    })
}