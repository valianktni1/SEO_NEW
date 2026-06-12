import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({
  baseURL: API,
  timeout: 30000,
});

export const DEFAULT_URL = "https://perfectweddingsbymark.uk";
export const BUSINESS_NAME = "Weddings By Mark";
