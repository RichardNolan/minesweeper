import React, { Component } from 'react'

class Square extends Component {


    render () {
        let {is_revealed, is_flagged, is_mine, surrounding_mines, id} = this.props.s
        let {reveal, flag} = this.props
        
        let revealed = is_revealed ? 'revealed' : 'not-revealed'
        let show_mine = this.props.is_revealed && is_mine ? 'mine' : ''
        let flagged = is_flagged ? 'flag' : ''
        let incorrect_flag = is_flagged
                    && !is_mine
                    && is_revealed
                ? 'incorrect_flag' : ''
        let count = is_revealed 
                    && !is_mine 
                    && !is_flagged
                    && surrounding_mines
                ? surrounding_mines : null
        return (
            <div 
                className={'square icon ' + revealed + " " + show_mine+ " " + incorrect_flag+ " "+flagged} 
                onClick={reveal.bind(this, id)} 
                onContextMenu={flag.bind(this, id)}
            >
                {count}
            </div>
        )
    }
}

export default Square