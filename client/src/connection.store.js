import {writable} from 'svelte/store';

/* connectionState: 'NotJoined' | 'Joining' | 'Joined' */
export const connections = writable({
    connectionState: 'NotJoined',
    connection: null,
    current_message: null
});

export const joinGame = (name) => {
    return fetch("https://mini-coup.herokuapp.com/join-game", {
        method: "POST",
        headers: {
        "Content-Type": "application/json",
        },
        body: JSON.stringify({name}),
    })
    .then((response) => response.json());
}