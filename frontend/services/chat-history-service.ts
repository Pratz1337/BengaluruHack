import { Socket } from "socket.io-client";
import { API_URL } from "../config";
import { InterestRate, RecentQuery } from "./api-service";

export const saveChatToHistory = async (socket: Socket, message: string, userId: string | null, loanType: string, p0: string) => {
    try {
        const response = await fetch(`${API_URL}/save-chat`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                user_id: userId,
                message,
                loan_type: loanType,
                timestamp: new Date().toISOString(),
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Chat saved successfully:", data);
    } catch (error) {
        console.error("Error saving chat to history:", error);
    }
};

// Fetch interest rates
export const fetchInterestRates = async (): Promise<InterestRate[]> => {
    try {
        const response = await fetch(`${API_URL}/interest-rates`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching interest rates:", error);
        return [];
    }
};

// Fetch recent queries
export const fetchRecentQueries = async (): Promise<RecentQuery[]> => {
    try {
        const response = await fetch(`${API_URL}/recent-queries`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching recent queries:", error);
        return [];
    }
};

// Fetch financial tips
export const fetchFinancialTips = async (): Promise<string[]> => {
    try {
        const response = await fetch(`${API_URL}/financial-tips`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching financial tips:", error);
        return [];
    }
};

// Fetch loan categories
export const fetchLoanCategories = async (): Promise<any[]> => {
    try {
        const response = await fetch(`${API_URL}/loan-categories`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching loan categories:", error);
        return [];
    }
};

// Fetch financial tools
export const fetchFinancialTools = async (): Promise<any[]> => {
    try {
        const response = await fetch(`${API_URL}/financial-tools`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching financial tools:", error);
        return [];
    }
};