import axios from 'axios';

const api = axios.create({
    baseURL: 'http://82.25.66.114:3000', // ip da VPS conexão com a API
});

const apiEsp = axios.create({
    baseURL: 'http://82.25.66.114:3001', // ip da VPS e conexão com o micro serviço que se comunica com a ESP
});

export const createRegistroEsp = async (endpoint, data) => {
    try {
        const response = await apiEsp.post(endpoint, data);
        return response.data;
    } catch (error) {
        console.error('Erro ao fazer POST', error);
        throw error;
    }
};