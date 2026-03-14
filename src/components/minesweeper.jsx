import React, { useState, useEffect, useRef, useCallback } from 'react'
import Square from './square.jsx'

// Pure helper functions

function surroundingSquaresOf(s, gridSize) {
    const squares = []
    for (let r = s.y - 1; r <= s.y + 1; r++) {
        for (let c = s.x - 1; c <= s.x + 1; c++) {
            if (
                !(s.y === r && s.x === c) &&
                r >= 0 && c >= 0 &&
                c < gridSize && r < gridSize
            ) squares.push({ x: c, y: r })
        }
    }
    return squares
}

function createEmptyGrid(gridSize) {
    const total = Math.pow(gridSize, 2)
    return new Array(total).fill(0).map((_, index) => ({
        id: index,
        y: Math.floor(index / gridSize),
        x: index % gridSize,
        surrounding_mines: 0,
        is_revealed: false,
        is_mine: false,
        is_flagged: false,
    }))
}

function plantMinesOnGrid(grid, numberOfMines, gridSize) {
    let remaining = numberOfMines
    const newGrid = grid.map(el => ({ ...el }))
    while (remaining > 0) {
        const pos = Math.floor(Math.random() * newGrid.length)
        if (!newGrid[pos].is_mine) {
            newGrid[pos].is_mine = true
            const surrounding = surroundingSquaresOf(newGrid[pos], gridSize)
            for (const sq of surrounding) {
                const idx = newGrid.findIndex(el => el.x === sq.x && el.y === sq.y)
                if (idx !== -1) newGrid[idx].surrounding_mines += 1
            }
            remaining -= 1
        }
    }
    return newGrid
}

function revealSquare(grid, id, gridSize) {
    const square = grid.find(el => el.id === id)
    if (!square || square.is_flagged || square.is_revealed) return grid

    let newGrid = grid.map(el => el.id === id ? { ...el, is_revealed: true } : el)

    if (square.surrounding_mines === 0 && !square.is_mine) {
        const surrounding = surroundingSquaresOf(square, gridSize)
        for (const pos of surrounding) {
            const sq = newGrid.find(el => el.x === pos.x && el.y === pos.y)
            if (sq && !sq.is_revealed && !sq.is_flagged) {
                newGrid = revealSquare(newGrid, sq.id, gridSize)
            }
        }
    }

    return newGrid
}

function Minesweeper() {
    const [gridSize, setGridSize] = useState(10)
    const [numberOfMines, setNumberOfMines] = useState(20)
    const [grid, setGrid] = useState([])
    const [score, setScore] = useState(0)
    const [timer, setTimer] = useState(0)
    const [showBlast, setShowBlast] = useState(false)
    const [blast, setBlast] = useState({ x: 0, y: 0 })

    const timerRef = useRef(null)

    // Keep a ref in sync with state so interval callbacks always read fresh values
    const gameStateRef = useRef({ grid: [], numberOfMines: 20, gridSize: 10, timer: 0 })
    gameStateRef.current = { grid, numberOfMines, gridSize, timer }

    const resetTimer = useCallback(() => {
        clearInterval(timerRef.current)
        timerRef.current = null
    }, [])

    const calculateAndSetScore = useCallback((mines, size, time) => {
        const difficulty = 1 + (mines / Math.pow(size, 2))
        const calculatedScore = Math.round((Math.pow(difficulty, 11) / (time || 1)) * 10000)
        setScore(calculatedScore)
        if (typeof Storage !== 'undefined') {
            if (!localStorage.getItem('high_score')) localStorage.setItem('high_score', '0')
            if (calculatedScore > parseInt(localStorage.getItem('high_score'), 10)) {
                localStorage.setItem('high_score', calculatedScore.toString())
                alert('NEW HIGH SCORE!!!')
            }
        }
    }, [])

    const startTimer = useCallback(() => {
        if (!timerRef.current) {
            timerRef.current = setInterval(() => {
                const { grid: currentGrid, numberOfMines: mines, gridSize: size, timer: currentTime } = gameStateRef.current
                if (currentGrid.filter(el => !el.is_revealed).length === mines) {
                    clearInterval(timerRef.current)
                    timerRef.current = null
                    calculateAndSetScore(mines, size, currentTime)
                }
                setTimer(prev => prev + 1)
            }, 1000)
        }
    }, [calculateAndSetScore])

    const buildGrid = useCallback((size, mines) => {
        resetTimer()
        const empty = createEmptyGrid(size)
        const newGrid = plantMinesOnGrid(empty, mines, size)
        setGrid(newGrid)
        setTimer(0)
        setScore(0)
        setShowBlast(false)
    }, [resetTimer])

    useEffect(() => {
        buildGrid(gridSize, numberOfMines)
        return resetTimer
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [buildGrid, resetTimer])

    function handleReveal(id, e) {
        if (e) e.preventDefault()
        startTimer()

        const square = grid.find(el => el.id === id)
        if (!square || square.is_flagged || square.is_revealed) return

        if (square.is_mine && !showBlast) {
            if (e) setBlast({ x: e.pageX, y: e.pageY })
            setShowBlast(true)
            setGrid(prev => prev.map(el => ({ ...el, is_revealed: true })))
            resetTimer()
            return
        }

        const newGrid = revealSquare(grid, id, gridSize)
        setGrid(newGrid)

        // Check if all non-mine squares are revealed
        if (newGrid.filter(el => !el.is_revealed).length === numberOfMines) {
            resetTimer()
            calculateAndSetScore(numberOfMines, gridSize, timer)
        }
    }

    function handleFlag(id, e) {
        if (e) e.preventDefault()
        startTimer()
        setGrid(prev => prev.map(el =>
            el.id === id && !el.is_revealed
                ? { ...el, is_flagged: !el.is_flagged }
                : el
        ))
    }

    function handleChangeGridSize(e) {
        const newSize = parseInt(e.target.value, 10)
        setGridSize(newSize)
        buildGrid(newSize, numberOfMines)
    }

    function handleChangeNumberOfMines(e) {
        const newMines = parseInt(e.target.value, 10)
        setNumberOfMines(newMines)
        buildGrid(gridSize, newMines)
    }

    const minesMarked = grid.filter(el => el.is_flagged).length
    const boom = showBlast ? 'boom' : ''
    const blastDisplay = showBlast ? 'block' : 'none'

    return (
        <div style={{ position: 'relative' }}>
            <div style={{ width: (gridSize * 3) + '0px' }} className="minesweeper">
                <div className="toolbar clearfix">
                    <div className="label icon flag"><div className="badge">{minesMarked}</div></div>
                    <div className="label icon">
                        <button onClick={() => buildGrid(gridSize, numberOfMines)} className="go">GO</button>
                    </div>
                    <div className="label icon timer">{timer}</div>
                </div>
                <div id="grid" className="clearfix">
                    {grid.map((s, index) => (
                        <Square
                            s={s}
                            key={index}
                            flag={handleFlag}
                            reveal={handleReveal}
                        />
                    ))}
                </div>
                <div className="toolbar clearfix">
                    <div className="label icon mine">
                        <input type="number" value={numberOfMines} onChange={handleChangeNumberOfMines} />
                    </div>
                    <div className="label icon score">{score}</div>
                    <div className="label icon grid">
                        <input type="number" value={gridSize} onChange={handleChangeGridSize} />
                    </div>
                </div>
            </div>
            <div
                className={'blast ' + boom}
                style={{ left: blast.x + 'px', top: blast.y + 'px', display: blastDisplay }}
            />
        </div>
    )
}

export default Minesweeper
