import React, { useState, useEffect, useRef, useCallback } from 'react'
import Square from './square.jsx'

function Minesweeper() {
  const [gridSize, setGridSize] = useState(10)
  const [numberOfMines, setNumberOfMines] = useState(20)
  const [grid, setGrid] = useState([])
  const [score, setScore] = useState(0)
  const [timer, setTimer] = useState(0)
  const [showBlast, setShowBlast] = useState(false)
  const [blast, setBlast] = useState({ x: 0, y: 0 })
  const timerRef = useRef(null)
  const gridRef = useRef(grid)
  const showBlastRef = useRef(showBlast)

  useEffect(() => {
    gridRef.current = grid
  }, [grid])

  useEffect(() => {
    showBlastRef.current = showBlast
  }, [showBlast])

  const surroundingSquares = useCallback((s, size) => {
    const surrounding = []
    for (let r = s.y - 1; r <= s.y + 1; r++) {
      for (let c = s.x - 1; c <= s.x + 1; c++) {
        if (
          !(s.y === r && s.x === c) &&
          r >= 0 && c >= 0 &&
          c < size && r < size
        ) surrounding.push({ x: c, y: r })
      }
    }
    return surrounding
  }, [])

  const emptyGrid = useCallback((size) => {
    const total = Math.pow(size, 2)
    return new Array(total).fill(0).map((_, index) => ({
      id: index,
      y: Math.floor(index / size),
      x: index % size,
      surrounding_mines: 0,
      is_revealed: false,
      is_mine: false,
      is_flagged: false,
    }))
  }, [])

  const plantMines = useCallback((baseGrid, numMines, size) => {
    let count = numMines
    const newGrid = baseGrid.map(el => ({ ...el }))
    while (count > 0) {
      const pos = Math.floor(Math.random() * newGrid.length)
      if (!newGrid[pos].is_mine) {
        newGrid[pos].is_mine = true
        const surrounding = surroundingSquares(newGrid[pos], size)
        for (const sq of surrounding) {
          newGrid.forEach(el => {
            if (el.x === sq.x && el.y === sq.y) el.surrounding_mines += 1
          })
        }
        count -= 1
      }
    }
    return newGrid
  }, [surroundingSquares])

  const resetTimer = useCallback(() => {
    clearInterval(timerRef.current)
    timerRef.current = null
  }, [])

  const buildGrid = useCallback((size, numMines) => {
    resetTimer()
    const empty = emptyGrid(size)
    const withMines = plantMines(empty, numMines, size)
    setGrid(withMines)
    setTimer(0)
    setScore(0)
    setShowBlast(false)
  }, [emptyGrid, plantMines, resetTimer])

  useEffect(() => {
    buildGrid(gridSize, numberOfMines)
    return () => resetTimer()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const startTimer = useCallback(() => {
    if (!timerRef.current) {
      timerRef.current = setInterval(() => {
        setTimer(t => t + 1)
      }, 1000)
    }
  }, [])

  const getScore = useCallback((numMines, size, time) => {
    const difficulty = 1 + (numMines / Math.pow(size, 2))
    const newScore = Math.round((Math.pow(difficulty, 11) / time) * 10000)
    setScore(newScore)
    if (typeof Storage !== 'undefined') {
      if (!localStorage.getItem('high_score')) localStorage.setItem('high_score', '0')
      if (newScore > parseInt(localStorage.getItem('high_score'), 10)) {
        localStorage.setItem('high_score', newScore.toString())
        alert('NEW HIGH SCORE!!!')
      }
    }
  }, [])

  const reveal = useCallback((id, e, currentGridOverride) => {
    if (e) e.preventDefault()
    startTimer()
    const currentGrid = currentGridOverride || gridRef.current

    let blasted = false
    let newGrid = currentGrid.map(el => {
      if (el.id === id && !el.is_flagged) {
        if (el.is_mine && !showBlastRef.current) {
          blasted = true
        }
        return { ...el, is_revealed: true }
      }
      return el
    })

    if (blasted && e) {
      setBlast({ x: e.pageX, y: e.pageY })
      setShowBlast(true)
      showBlastRef.current = true
      newGrid = newGrid.map(el => ({ ...el, is_revealed: true }))
      setGrid(newGrid)
      resetTimer()
      return
    }

    // BFS to reveal all connected blank squares
    const revealedEl = newGrid.find(el => el.id === id)
    if (revealedEl && revealedEl.surrounding_mines === 0 && !revealedEl.is_mine && !revealedEl.is_flagged) {
      let toProcess = [revealedEl]
      const processed = new Set([id])
      while (toProcess.length > 0) {
        const next = []
        for (const sq of toProcess) {
          const surrounding = surroundingSquares(sq, gridSize)
          newGrid = newGrid.map(el => {
            for (const s of surrounding) {
              if (el.x === s.x && el.y === s.y && !el.is_revealed && !el.is_flagged && !processed.has(el.id)) {
                processed.add(el.id)
                const updated = { ...el, is_revealed: true }
                if (updated.surrounding_mines === 0 && !updated.is_mine) {
                  next.push(updated)
                }
                return updated
              }
            }
            return el
          })
        }
        toProcess = next
      }
    }

    setGrid(newGrid)

    // Check if game is finished
    const unrevealed = newGrid.filter(el => !el.is_revealed).length
    if (unrevealed === numberOfMines) {
      clearInterval(timerRef.current)
      timerRef.current = null
      setTimer(t => {
        getScore(numberOfMines, gridSize, t > 0 ? t : 1)
        return t
      })
    }
  }, [startTimer, surroundingSquares, gridSize, numberOfMines, resetTimer, getScore])

  const flag = useCallback((id, e) => {
    if (e) e.preventDefault()
    startTimer()
    setGrid(prev => prev.map(el => {
      if (el.id === id && !el.is_revealed) return { ...el, is_flagged: !el.is_flagged }
      return el
    }))
  }, [startTimer])

  const handleChangeGridSize = (e) => {
    const size = parseInt(e.target.value, 10)
    setGridSize(size)
    buildGrid(size, numberOfMines)
  }

  const handleChangeNumberOfMines = (e) => {
    const mines = parseInt(e.target.value, 10)
    setNumberOfMines(mines)
    buildGrid(gridSize, mines)
  }

  const minesMarked = grid.filter(el => el.is_flagged).length
  const boom = showBlast ? 'boom' : ''
  const blastDisplay = showBlast ? 'block' : 'none'

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ width: (gridSize * 3) + '0px' }} className='minesweeper'>
        <div className="toolbar clearfix">
          <div className="label icon flag"><div className="badge">{minesMarked}</div></div>
          <div className="label icon"><button onClick={() => buildGrid(gridSize, numberOfMines)} className="go">GO</button></div>
          <div className="label icon timer">{timer}</div>
        </div>
        <div id='grid' className="clearfix">
          {grid.map((s) => (
            <Square
              s={s}
              key={s.id}
              flag={flag}
              reveal={reveal}
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
