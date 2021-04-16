<script>
    import { fade } from 'svelte/transition';
    let display_active = false;
    export function showRules() {
        display_active = true;
    }
</script>

{#if display_active}
    <div transition:fade id="frame" on:click={()=>{display_active = false;}}>
        <img id="close" alt="close">
        <div id="content">
            <h1>Rules</h1>
            <p><b>Objective:</b> To be the only player with any cards left.</p>
            <p><b>Set-up:</b> The standard game may be played with 3 to 6 players. The deck, which consists of 15 cards (three of each character), is shuffled. Each player is dealt two cards and receives two coins from an unlimited store. Players should not reveal which cards they have been dealt.</p>
            <p><b>Cards:</b> There are five different characters in the deck, each of which has one or more special abilities:</p>
                <ul>
                    <li><b>the Duke</b> - can take tax and block foreign aid</li> 
                    <li><b>the Assassin</b> - can force one player to lose a card</li> 
                    <li><b>the Captain</b> - can steal from another player, and block being stolen from</li>
                    <li><b>the Ambassador</b> - can exchange up to two cards with the deck, and also block being stolen from</li> 
                    <li><b>the Contessa</b> - can block a direct assassination attempt</li>
                </ul>
            <p><b>Play:</b> For the duration of the game, players take turns performing one of the available actions. Three moves -- Income, Foreign Aid, and Coup -- are available to all players, while the rest are specific to certain characters. Part of the objective of the game is to bluff successfully, as needed or desired.</p>
                <ul>
                    <li><b>Income:</b> Take one coin from the bank. This cannot be Challenged or Blocked.</li>
                    <li><b>Foreign Aid:</b> Take two coins from the bank. This cannot be Challenged but it can be Blocked by the Duke.</li>
                    <li><b>Coup:</b> Costs seven coins, and causes a player to lose a card. Cannot be Challenged or Blocked. If you start your turn with 10 or more coins, you must take this action.</li>
                    <li><b>Tax (the Duke):</b> Take three coins from the bank. Can be Challenged, should another player suspect you of bluffing, but not Blocked.</li>
                    <li><b>Assassinate (the Assassin):</b> Costs three coins. Force one player to lose a card of their choice. Can be Challenged by any suspecting player, and Blocked by the Contessa.</li>
                    <li><b>Steal (the Captain):</b> Take two coins from another player. Can be Challenged. Can be Blocked by the Captain or an Ambassador.</li>
                    <li><b>Exchange Cards (the Ambassador):</b> Draw two cards from the deck and mix them with your current hand, then choose two cards to return to the deck. Can be Challenged, but cannot be Blocked.</li>
                </ul>
            <p><b>Blocking:</b> If another player takes an action that can be Blocked, any other player may Block it by claiming to have the appropriate card. If the Block is successful, the acting player cannot perform the action and takes no other action this turn. The acting player MAY choose to Challenge the Blocking player. If they win the Challenge, the action goes through as normal.</p>
            <p><b>Challenging:</b> When the acting player declares their action, any other player may attempt to Challenge it. The acting player must then prove they have the power to take the action or lose the Challenge. If they do have the appropriate card, they reveal it; the revealed card is then returned to the deck and a replacement is drawn. In this case, the player who Challenged them has lost the Challenge and must lose a card. However, if the Challenge is successful, the player who was Challenged loses a card, instead.</p>
            <p><i>A Special Note on Challenging:</i> Should you Challenge a player attempting to Assassinate you and <i>lose</i>, you will lose both your cards: one for the lost Challenge, and another for the Assassination. So -- be mindful!</p>
            <p><b>Finally, be sure to note: <i>there is no second place.</i></b></p>
        </div>
    </div>
{/if}

<style>
    #frame {
        margin: 3em;
        box-sizing: border-box;
        padding: 2em;
        height: calc(100% - 6em);
        width: calc(100vw - 6em);
        z-index: 2;
        position: absolute;
        top: 0;
        left: 0;
        overflow: hidden;
        border-radius: 25px;
        border: 1px solid #ccc;
        border-bottom: 3px solid rgba(193, 182, 159, 0.8);
        background-size: cover;
        background-image: url("/assets/bgs/white.jpg");
    }
    
    #content {
        height: 100%;
        overflow: scroll;
        -ms-overflow-style: none; 
        scrollbar-width: none;  
    }
    #content::-webkit-scrollbar { 
        display: none;  
    }
    
    #close {
        background: url(data:image/png;base64,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);
        padding: 5;
        position: absolute;
        top: 5px;
        right: 5px;
        z-index: 2;
    }

    h1 {
        text-transform: uppercase;
        font-size: 3em;
        font-weight: 100;
        width: fit-content;
        margin-right: auto;
        margin-left: auto;
    }
</style>