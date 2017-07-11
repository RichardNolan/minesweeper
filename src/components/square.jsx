import React, { Component } from 'react'

class Square extends Component {


    render () {
        let revealed = this.props.is_revealed ? 'revealed' : 'not-revealed'
        let show_mine = this.props.is_revealed && this.props.is_mine ? 'mine' : null
        let flag = this.props.is_flagged ? 'flag' : null
        let incorrect_flag = this.props.is_flagged
                    && !this.props.is_mine
                    && this.props.is_revealed
                ? 'incorrect_flag' : null
        let count = this.props.is_revealed 
                    && !this.props.is_mine 
                    && !this.props.is_flagged
                    && this.props.surrounding_mines
                ? this.props.surrounding_mines : null
        return (
            <div 
                className={'square icon ' + revealed + " " + show_mine+ " " + incorrect_flag+ " "+flag} 
                onClick={this.props.reveal.bind(this, this.props.id)} 
                onContextMenu={this.props.flag.bind(this, this.props.id)}
            >
                {count}
            </div>
        )
    }
}

export default Square