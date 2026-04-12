import { createContext, useContext, useRef} from "react";
import { useState } from "react";
import {server} from "../main.jsx";
import { useEffect } from "react";
import api from "../apiIntercepter.js";

const Appcontext = createContext(null);

export const AppProvider = ({children})=>{
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(() => {
        // Only start in loading if the user has not logged out
        return localStorage.getItem('hasLoggedOut') !== 'true';
    });
    const [isAuth, setIsAuth] = useState(false);
    const [hasLoggedOut, setHasLoggedOut] = useState(() => {
        // Check localStorage for logout state
        return localStorage.getItem('hasLoggedOut') === 'true';
    });
    const hasCheckedAuth = useRef(false);

    async function fetchUser() {
        // Don't make API call if user has logged out
        if (localStorage.getItem('hasLoggedOut') === 'true') {
            setUser(null);
            setIsAuth(false);
            return;
        }

        try {
            const {data} = await api.get(`/api/v1/me`);
            setUser(data);
            setIsAuth(true);
            setHasLoggedOut(false);
            localStorage.removeItem('hasLoggedOut'); // Clear logout state on successful auth
        } catch (error) {
            if (error.response?.status === 401) {
                setUser(null);
                setIsAuth(false);
            }
            console.log(error);
        }
    }

    // Check auth status on app load
    async function checkAuth() {
        const loggedOut = localStorage.getItem('hasLoggedOut') === 'true';
        if (loggedOut || hasLoggedOut) {
            setLoading(false);
            return;
        }
        setLoading(true);
        await fetchUser();
        setLoading(false);
    }

    async function logout() {
        try {
            await api.post(`/api/v1/logout`);
            setUser(null);
            setIsAuth(false);
            setHasLoggedOut(true);
            setLoading(false);
            localStorage.setItem('hasLoggedOut', 'true'); // Persist logout state
            window.hasLoggedOut = true; // Set global flag
            hasCheckedAuth.current = false;
        } catch (error) {
            console.log(error);
            setLoading(false);
        }
    }

    async function login() {
        setHasLoggedOut(false);
        localStorage.removeItem('hasLoggedOut'); // Clear logout state
        window.hasLoggedOut = false; // Clear global flag
        await fetchUser();
    }

    useEffect(()=>{
        // Never check auth if user has logged out
        const loggedOut = localStorage.getItem('hasLoggedOut') === 'true';
        if (loggedOut) {
            setLoading(false);
            setHasLoggedOut(true);
            return;
        }
        
        if (!hasCheckedAuth.current) {
            hasCheckedAuth.current = true;
            checkAuth();
        }
    },[]);

    return (<Appcontext.Provider value={{user, setUser, loading, setLoading, isAuth, setIsAuth, fetchUser, logout, login}}>
        {children}
    </Appcontext.Provider>);
       };

export const AppData = () =>{
    const context = useContext(Appcontext);
    
    if(!context){
        throw new Error("AppData must be used within AppProvider");
    }
    return context;
}