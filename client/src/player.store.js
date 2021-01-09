import {writable} from 'svelte/store';

export const player = writable({
    name: null,
    admin: null,
    active: false,
    coins: 0,
    cards: []
});

export const setPlayerName = (name) => {
    player.update(state => ({
        ...state,
        name
    }))
}