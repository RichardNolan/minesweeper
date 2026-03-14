import React from 'react'

function Square({ s, reveal, flag }) {
  const { is_revealed, is_flagged, is_mine, surrounding_mines, id } = s

  const revealed = is_revealed ? 'revealed' : 'not-revealed'
  const show_mine = is_revealed && is_mine ? 'mine' : ''
  const flagged = is_flagged ? 'flag' : ''
  const incorrect_flag = is_flagged && !is_mine && is_revealed ? 'incorrect_flag' : ''
  const count = is_revealed && !is_mine && !is_flagged && surrounding_mines ? surrounding_mines : null

  return (
    <div
      className={'square icon ' + revealed + ' ' + show_mine + ' ' + incorrect_flag + ' ' + flagged}
      onClick={() => reveal(id)}
      onContextMenu={(e) => flag(id, e)}
    >
      {count}
    </div>
  )
}

export default Square