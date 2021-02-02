import {writable} from 'svelte/store';

/* connectionState: 'NotJoined' | 'Joining' | 'Joined' */
export const connections = writable({
    connectionState: 'NotJoined',
    connection: null,
    current_message: null
});

export const createRoom = () => {
    let response = await fetch('/create-room', {method: 'POST'});
    if (response.ok) {
        let result = await response.json();
        return result.room;
    } else {
        console.log(response.status);
        return response.status;
    }
}