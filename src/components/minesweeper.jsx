import React, { Component } from 'react'
import Square from './square.jsx'

class Minesweeper extends Component {
    constructor(){
        super()
        this.state = {
            grid_size:10,
            grid:[],
            number_of_mines:20,
            timer:0
        }
        this.timer = null
    }

    componentDidMount(){
        this.buildGrid()
    }

    buildGrid(){
        let grid = this.emptyGrid()
        this.setState({grid:grid, timer:0}, ()=>{
            this.plantMines()  
        })
    }

    plantMines(){  
        let {number_of_mines, grid} = this.state       

        while(number_of_mines>0){
            let mine_position = Math.floor(Math.random()*this.state.grid.length)
            if(!grid[mine_position].is_mine){
                grid[mine_position].is_mine = true
                

                let surrounding_squares = this.surroundingSquares(grid[mine_position])
                for(let s in surrounding_squares){
                    let square = surrounding_squares[s]
                    grid.map(el=>{
                        if(el.x===square.x && el.y===square.y){
                            el.surrounding_mines+=1
                        }
                        return el
                    })
                }


                number_of_mines-=1
            }
        }

        this.setState({grid:grid})
    }

    surroundingSquares(s){
        let surrounding_squares = []
        for(let r=s.y-1;r<=s.y+1;r++){
            for(let c=s.x-1;c<=s.x+1;c++){
                if( !(s.y===r && s.x===c)    
                    &&  r>=0
                    &&  c>=0
                    &&  c<this.state.grid_size
                    &&  r<this.state.grid_size
                )  surrounding_squares.push({x:c,y:r})
            }
        }
        return surrounding_squares
    }

    emptyGrid(){
        let total = Math.pow(this.state.grid_size, 2)
        return new Array(total).fill(0).map((el, index)=>({
            id:index,
            y:Math.floor(index/this.state.grid_size),
            x:index%this.state.grid_size,
            surrounding_mines:0,
            is_revealed: false,
            is_mine:false,
            is_flagged: false
        }))
    }

    revealBlanks(el){
        let surrounding_squares = this.surroundingSquares(el)
        this.state.grid.forEach(grid_square=>{
            for(let s in surrounding_squares){
                if(
                    grid_square.x===surrounding_squares[s].x && 
                    grid_square.y===surrounding_squares[s].y &&
                    !grid_square.is_revealed
                    ) this.reveal(grid_square.id)
                
            }
        })
    }

    flag(id, e){
        if(e) e.preventDefault()
        this.startTimer()
        let grid = this.state.grid.map(el=>{
            if(el.id===id && !el.is_revealed) el.is_flagged = !el.is_flagged
            return el
        })
        this.setState({grid:grid})
    }
    
    reveal(id, e){
        if(e) e.preventDefault()
        this.startTimer()
        let grid=this.state.grid.map(el=>{
            if(el.id===id && !el.is_flagged) el.is_revealed=true
            if(el.id===id && el.is_mine && !el.is_flagged) this.gameOver()
            if(el.id===id && el.surrounding_mines===0 && !el.is_flagged) this.revealBlanks(el)
            return el
        })
        this.setState({grid:grid})
    }
    startTimer(){
        if(!this.timer) this.timer = setInterval( this.updateClock.bind(this), 1000)
    }
    updateClock(){
        if(this.state.grid.filter(el=>!el.is_revealed).length===this.state.number_of_mines) clearInterval(this.timer)
        this.setState(ps=>({timer:ps.timer+1}))
    }
    gameOver(){
        let grid = this.state.grid.map(el=>{
            el.is_revealed = true
            return el
        })
        this.setState({grid:grid})
        clearTimeout(this.timer)
        this.timer = null
    }

    changeGridSize(e){
        this.setState({grid_size:parseInt(e.target.value, 10)}, ()=>this.buildGrid())
    }
    changeNumberOfMines(e){        
        this.setState({number_of_mines:parseInt(e.target.value, 10)}, ()=>this.buildGrid())
    }
    render () {
        let mines_marked = this.state.grid.filter(el=>el.is_flagged).length
        let grid = this.state.grid.map((s, index)=>{
               return <Square 
                key={index} 
                id={s.id}
                x={s.x}
                y={s.y}
                is_mine={s.is_mine} 
                is_flagged={s.is_flagged} 
                is_revealed={s.is_revealed}
                surrounding_mines={s.surrounding_mines}
                flag={this.flag.bind(this)}
                reveal={this.reveal.bind(this)}
                gameOver={this.gameOver.bind(this)} 
                revealBlanks={this.revealBlanks.bind(this, s.y, s.x)}
                />
        })
        let timer = this.state.timer
        return (
                <div style={{'width':(this.state.grid_size*3)+'0px'}} className='minesweeper'>
                    {grid}
                <div>
                    <div className="label icon flag"><div className="badge">{mines_marked}</div></div>
                    <div className="label icon mine">
                        <input type="number" value={this.state.number_of_mines} onChange={this.changeNumberOfMines.bind(this)}/>
                    </div>
                    <div className="label icon grid">
                        <input type="number" value={this.state.grid_size} onChange={this.changeGridSize.bind(this)}/>
                    </div>
                    <div className="label icon timer">{timer}</div>
                    <div className="label icon clearfix"><button onClick={this.buildGrid.bind(this)} className="go">GO</button></div>
                </div>
            </div>
        )
    }
}

export default Minesweeper