
$$('.gridBox').forEach(x => {
  x.onclick = () => {
    $$('.gridBox').forEach(y => y.classList.remove('selected'))
    x.classList.add('selected')
  }
})

$$('.plBox').forEach(x => {
  x.onclick = () => {
    $$('.plBox').forEach(y => y.classList.remove('selected'))
    x.classList.add('selected')
  }
})

$('#playButton').onclick = gameStart;