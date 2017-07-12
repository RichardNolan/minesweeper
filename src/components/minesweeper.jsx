import React, { Component } from 'react'
import Square from './square.jsx'

class Minesweeper extends Component {
    constructor(){
        super()
        this.state = {
            grid_size:10,
            grid:[],
            number_of_mines:20,
            score:0,
            timer:0
        }
        this.timer = null
    }

    componentDidMount(){
        this.buildGrid()
    }


    /***************  SETUP GAME */

    buildGrid(){
        let grid = this.emptyGrid()
        this.setState({grid:grid, timer:0, score:0}, ()=>{
            this.resetTimer()
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

    /**  END SETUP FUNCTIONS */




    /**********       GAMEPLAY FUNCTIONS */
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

    isGameFinished(){
        if(this.state.grid.filter(el=>!el.is_revealed).length===this.state.number_of_mines){
            clearInterval(this.timer);
            this.getScore()
        }
    }

    getScore(){
        console.log("GAME OVER")
        let difficulty = 1+(this.state.number_of_mines/Math.pow(this.state.grid_size, 2) )   
        let score = Math.round((Math.pow(difficulty,11)/this.state.timer)*10000)
        this.setState({score:score}, ()=>{
            if (typeof(Storage) !== "undefined") {
                if(!localStorage.getItem("high_score")) localStorage.setItem("high_score", "0");
                if(score>parseInt(localStorage.getItem("high_score"), 10)){
                    localStorage.setItem("high_score", score.toString());
                    alert("NEW HIGH SCORE!!!")
                }
                
            } 
        })
    }

    gameOver(){
        let grid = this.state.grid.map(el=>{
            el.is_revealed = true
            return el
        })
        this.setState({grid:grid})
        this.resetTimer()
    }

    /** END GAMPLAY FUNCTIONS */






    /*****************         GRID OPTIONS */

    changeGridSize(e){
        this.setState({grid_size:parseInt(e.target.value, 10)}, ()=>this.buildGrid())
    }
    changeNumberOfMines(e){        
        this.setState({number_of_mines:parseInt(e.target.value, 10)}, ()=>this.buildGrid())
    }

    /** END GRID OPTIONS */








    /*****************         TIMER FUNCTIONS */

    startTimer(){
        if(!this.timer) this.timer = setInterval( this.updateClock.bind(this), 1000)
    }
    resetTimer(){        
        clearTimeout(this.timer)
        this.timer = null
    }
    updateClock(){
        this.isGameFinished()
        this.setState(ps=>({timer:ps.timer+1}))
    }

    /**  END TIMER FUNCTIONS */





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

        return (
                <div style={{'width':(this.state.grid_size*3)+'0px'}} className='minesweeper'>
                    <div className="toolbar clearfix">
                        <div className="label icon flag"><div className="badge">{mines_marked}</div></div>
                        <div className="label icon"><button onClick={this.buildGrid.bind(this)} className="go">GO</button></div>
                        <div className="label icon timer">{this.state.timer}</div>
                    </div>
                    <div id='grid' className="clearfix">{grid}</div>
                <div className="toolbar clearfix">
                    <div className="label icon mine">
                        <input type="number" value={this.state.number_of_mines} onChange={this.changeNumberOfMines.bind(this)}/>
                    </div>
                    <div className="label icon score">{this.state.score}</div>
                    <div className="label icon grid">
                        <input type="number" value={this.state.grid_size} onChange={this.changeGridSize.bind(this)}/>
                    </div>                    
                </div>
            </div>
        )
    }
}

export default Minesweeper