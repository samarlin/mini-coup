import {writable} from 'svelte/store';

/* connectionState: 'Failed' | 'NotJoined' | 'Joining' | 'Joined' */
export const connections = writable({
    connectionState: 'NotJoined',
    connection: null,
    current_message: null, 
    router: null
});

export async function createRoom(){
    let response = await fetch('/create-room', {method: 'POST'});
    if (response.ok) {
        let result = await response.json();
        return {room: result.room, status: 'ok'};
    } else {
        return {status: response.status};
    }
}

export async function joinRoom(room){
    let response = await fetch('/join-room', {
        method: 'POST',
        headers: {
            "Content-Type": "application/json",
            },
        body: JSON.stringify({room})});

    if (response.ok) {
        let result = await response.json();
        return {exists: result.exists, open: result.open, curr_players: result.curr_players, status: 'ok'};
    } else {
        return {status: response.status};
    }
}