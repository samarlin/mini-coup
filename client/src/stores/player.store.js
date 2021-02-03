import {writable} from 'svelte/store';

export const player = writable({
    name: null,
    admin: null,
    alive: true,
    room: null,
    coins: 0,
    cards: []
});

export const opponents = writable({});