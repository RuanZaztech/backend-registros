import axios from 'axios';

const api = axios.create({
    baseURL: 'https://srv737240.hstgr.cloud', // ip da VPS conexão com a API
});

export const createRegistroEsp = async (endpoint, data) => {
    try {
        const response = await api.post(endpoint, data);
        return response.data;
    } catch (error) {
        console.error('Erro ao fazer POST', error);
        throw error;
    }
};