import {writable} from 'svelte/store';
import {readable} from 'svelte/store';

export const player = writable({
    name: null,
    admin: null,
    alive: true,
    room: null,
    coins: 0,
    cards: [],
    lost_cards: []
});

export const opponents = writable({});

export const move_mappings = readable({
    TAKE_SECONDARY_ACTION: 'a response',
    TAKE_PRIMARY_ACTION: 'a move',
    REVEAL_CARD: 'card to reveal',
    COUP: 'after being couped',
    BLUFF: 'after being challenged',
    FAILED_BLUFF: 'after failing a challenge',
    ASSASSINATION: 'after being assassinated',
    APPROVED_MOVE: 'approved a move',
    LOST_CARD: 'lost a card',
    //DIED: 'died', //leaving this one out on purpose tbh
    REVEALED_CARD: 'revealed a card and drew a new one',
    CARDS_CHOSEN: 'exchanged cards',
    CHOOSE_CARDS: 'cards to exchange',
    CHOOSE_PLAYER: 'a target'
});

export const reverse = readable({
    'Exchange': 'DRAW_CARDS',
    'Block Aid': 'BLOCK_AID',
    'Block Steal': 'BLOCK_STEAL',
    'Block Assassinate': 'BLOCK_ASSASSINATE',
    'Approve Move': 'APPROVE_MOVE',
    'Coup': 'COUP_PLAYER',
    'Call Bluff': 'CALL_BLUFF',
    'Steal': 'STEAL_FROM_PLAYER',
    'Tax': 'TAKE_TAX',
    'Assassinate': 'ASSASSINATE_PLAYER',
    'Income': 'TAKE_INCOME',
    'Foreign Aid': 'TAKE_FOREIGN_AID',
    'TAKE_FOREIGN_AID': 'Foreign Aid',
    'TAKE_INCOME': 'Income',
    'ASSASSINATE_PLAYER': 'Assassinate',
    'TAKE_TAX': 'Tax',
    'STEAL_FROM_PLAYER': 'Steal',
    'DRAW_CARDS': 'Exchange',
    'BLOCK_AID': 'Block Aid',
    'BLOCK_STEAL': 'Block Steal',
    'BLOCK_ASSASSINATE': 'Block Assassinate',
    'APPROVE_MOVE': 'Approve Move',
    'COUP_PLAYER': 'Coup',
    'CALL_BLUFF': 'Call Bluff'
});

export const tenses = readable({
    COUP_PLAYER: 'announced a coup against',
    CALL_BLUFF: 'called the bluff of',
    TAKE_FOREIGN_AID: 'attempted to take foreign aid',
    TAKE_INCOME: 'took income',
    ASSASSINATE_PLAYER: 'tried to assassinate',
    TAKE_TAX: 'attempted to draw tax',
    STEAL_FROM_PLAYER: 'tried to steal from',
    DRAW_CARDS: 'attempted to exchange cards',
    BLOCK_AID: 'blocked attempt to take foreign aid by',
    BLOCK_STEAL: 'blocked attempted theft by',
    BLOCK_ASSASSINATE: 'blocked assassination attempt from',
    APPROVE_MOVE: 'approved a move by'
});