<script>
    let display_active = false;
    $: display_style = (display_active) ? "block" : "none";
    export function showRules() {
        display_active = true;
    }
</script>

<div id="frame" style="--display: {display_style}" on:click={()=>{display_active = false;}}>
    <div id="content">
        <h1>Rules</h1>
        <p><b>Objective:</b> To be the only player with any cards left.</p>
        <p><b>Set-up:</b> The deck, which consists of 15 cards (three of each character), is shuffled. Each player is dealt two cards and receives two coins from an unlimited store. Players should not reveal which cards they have been dealt.</p>
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
                <li><b>Taxes (the Duke):</b> Take three coins from the bank. Can be Challenged, should another player suspect you of bluffing.</li>
                <li><b>Assassinate (the Assassin):</b> Costs three coins. Force one player to lose a card of their choice. Can be Challenged by any suspecting player, and Blocked by the Contessa.</li>
                <li><b>Steal (the Captain):</b> Take two coins from another player. Can be Challenged. Can be Blocked by the Captain or an Ambassador.</li>
                <li><b>Exchange Cards (the Ambassador):</b> Draw two cards from the deck and mix them with your current hand, then choose two cards to return to the deck. Can be Challenged, but cannot be Blocked.</li>
            </ul>
        <p><b>Blocking:</b> If another player takes an action that can be Blocked, any other player may Block it by claiming to have the appropriate card. If the Block is successful, the acting player cannot perform the action and takes no other action this turn. The acting player MAY choose to Challenge the Blocking player. If they win the Challenge, the action goes through as normal.</p>
        <p><b>Challenging (Call Bluff):</b> When the acting player declares their action, any other player may attempt to call their bluff. The acting player now must prove they have the power to take the action or lose the Challenge. If they have the appropriate card, they reveal it and place the revealed card back in the deck, drawing a new one to replace it. In this case, the player who challenged them has lost the Challenge and must lose a card. However, if the challenge is successful, the player who was challenged loses a card, instead.</p>
        <p><i>A Special Note on Challenging:</i> Should you challenge a player attempting to assassinate you and <i>lose</i>, you will lose both your cards: one for the lost challenge, and another for the assassination. So -- be mindful!</p>
        <p><b>Lastly, be sure to note: <i>there is no second place.</i></b></p>
    </div>
</div>

<style>
    #frame {
        display: var(--display);
        margin: 3em;
        box-sizing: border-box;
        padding: 2em;
        height: calc(100vh - 6em);
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
        height: calc(100vh - 10em);
        overflow: scroll;
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