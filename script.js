
const $ = x => document.querySelector(x)
const $$ = x => document.querySelectorAll(x)

const TURNS = [
  "--red", "--blue", "--yellow", "--green", "--pink", "--purple"
]

let playerFirstMove = {};

// let playerCount = prompt(`How many players ( default = 2, max = ${TURNS.length} ) : `);
// playerCount = playerCount / 1 ? playerCount / 1 : 2;
// playerCount = playerCount < 2 ? 2 : playerCount > TURNS.length ? TURNS.length : playerCount;
let playerCount = 2;

let curPlayer = Math.floor(Math.random() * playerCount);

let gridX = 10;
let gridY = 10;
let gridSize = gridX * gridY;

let winList = [];

const game = $('.mainGame');

game.style.setProperty('--gridX', gridX);

function checkWin() {
  // all players should have made their first move
  for ( let i = 0; i < playerCount; i++) {
    if ( playerFirstMove[`player-${i}`] === undefined ) return -1;
  }

  let winner = -1;

  // check for win : all boxes should be occupied by a single player
  for ( let i = 0; i < playerCount; i++) {
    let toMatch = `player-${i}`;

    let inverseWin = $(`.box.${toMatch}`) == null;

    let checkWin = [...$$('.box')].every(box => (
      (box.className.indexOf('player') == -1) || (box.className.indexOf(toMatch) !== -1)
    ))

    // i.e : lose
    if (inverseWin) {
      winList.unshift(TURNS[i]);
    }
    // set the winner
    else if ( checkWin ) {
      winner = i; continue;
    }
  }

  return winner;

}

async function doChainReaction(elemListQuery, curPlayer) {

  let elems = [...$$(elemListQuery)];
  
  if ( elems.length == 0 ) return false;

  var promiseResolve;
  let promise = new Promise(function(r) {
    promiseResolve = r;
  });

  elems.forEach(elem => {
    let placeN = elem.className.match(/box-n-(\d+)/)[1] / 1;

    console.log(gridX)

    // the four places to target
    let allPlaces = [placeN - 1, placeN + 1, placeN - gridX, placeN + gridX].map((x,i) => {
      /* to prevent mis-targets */
      if ((x >= 0) && (x < gridSize) && ( i > 1 || (Math.floor(x / gridX) == Math.floor(placeN / gridX)))) {
        return x;
      }

      return null;
    });

    allPlaces.forEach(async function(n,i) {

      let promiseToResolve;
      let promiseToWait = new Promise(function(r) {
        promiseToResolve = r;
      })

      if ( n == null ) return;
      let placeElem = $(`.box-n-${n}`);
      let dotN = placeElem.className.match(/dot(\d)/)
      dotN = dotN ? dotN[1] / 1 : 0;
      dotN = dotN > 4 ? dotN % 4 + 1: dotN;
      if ( placeElem.classList.contains('chainReacted') ) {
        dotN = 0;
      }
      placeElem.className = `appearMove box box-n-${n} dot${dotN+1} player-${curPlayer} move-${['left', 'right', 'up', 'down'][i]}`
      placeElem.style.setProperty('--color', `var(${TURNS[curPlayer]})`);

      setTimeout(function() {
        placeElem.classList.remove('appearMove')
        promiseToResolve();
      }, 500);

      await promiseToWait;
    });

    elem.style.backgroundColor = "var(--bg)";
    elem.classList.add('chainReacted')
    /* set the original box empty after 100ms */
    setTimeout(() => {
      elem.className = `box box-n-${placeN}`;
      elem.style.backgroundColor = "";
    }, 100)

    /* do the next chain reaction a bit later */
    setTimeout(() => {
      promiseResolve(doChainReaction('.box.dot4', curPlayer));
    }, 400)
  })

  return promise;
}

function gameStart() {

  $('.chooseScreen').classList.add('hidden');
  playerCount = $('.plBox.selected').style.getPropertyValue('--player') / 1;
  gridX = $('.gridBox.selected').style.getPropertyValue('--gridX') / 1;
  gridY = $('.gridBox.selected').style.getPropertyValue('--gridY') / 1;
  gridSize = gridX * gridY;

  game.style.setProperty('--gridX', gridX);
  game.classList.remove('hidden')

  for ( let i = 0; i < gridSize; i++) {
    let elem = document.createElement('div')
    elem.classList.add('box');
    elem.classList.add(`box-n-${i}`);
    elem.innerHTML = "<div class='dot12'></div><div class='dot34'></div>"
    elem.onclick = async function() {
      
      if ( elem.className.search(/dot\d/) == -1 ) {
        if ( playerFirstMove[`player-${curPlayer}`] !== undefined ) return;
        elem.style.setProperty('--color', `var(${TURNS[curPlayer]})`)
        elem.classList.add(`dot3`)
        // elem.dataset.dot = 3;
        playerFirstMove[`player-${curPlayer}`] = true;
        elem.classList.add(`player-${curPlayer}`);
        curPlayer = (curPlayer+1) % playerCount;
  
      } else {
        
        // check for player mismatch
        if ( elem.className.indexOf('player') ) {
          let playerN = elem.className.match(/player-(\d+)/)[1] / 1;
          if ( playerN !== curPlayer ) return;
        }
  
        let dotN = elem.className.match(/dot(\d)/)[1] / 1
        elem.classList.remove(`dot${dotN}`);
        elem.classList.add(`dot${dotN+1}`);
        // elem.dataset.dot = dotN + 1;
  
        // do the chain reaction
        if ( dotN + 1 == 4 ) {
          await doChainReaction('.box.dot4', curPlayer);
        }

        // check for win after chain reaction
        let winPlayer = checkWin();
        if ( winPlayer !== -1 ) {
          game.classList.add('hidden')

          let loseList = ['🥈', '🥉', '👎']
          
          $('.winScreen').innerHTML = `
            <h1>Game Over</h1>
            <div class="winner" style="--color: var(${TURNS[winPlayer]})">
              <div class="position"><span>🥇</span></div>
              <div class="name">${TURNS[winPlayer].substring(2)}</div>
            </div>
          `

          for ( let i = 0; i < winList; i++) {
            $('.winScreen').innerHTML += `
              <div class="winner" style="--color: var(${winList[i]})">
                <div class="position"><span>${loseList[i < 3 ? i: 2]}</span></div>
                <div class="name">${winList[i].substring(2)}</div>
              </div>
            `
          }

          $('.winScreen').classList.remove('hidden')
        }

        curPlayer = (curPlayer+1) % playerCount;
      }
  
      document.body.style.setProperty('--color', `var(${TURNS[curPlayer]})`);
    }
    game.appendChild(elem);
    document.body.style.setProperty('--color', `var(${TURNS[curPlayer]})`)
  }
}