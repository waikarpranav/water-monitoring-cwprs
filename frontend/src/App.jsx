import { useEffect, useRef, useState } from 'react'
import Dashboard from './pages/Dashboard'

function App() {
  const [latest, setLatest] = useState(null)
  const [history, setHistory] = useState([])
  const [isConnected, setIsConnected] = useState(false)
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('cwrps_theme') || 'dark';
  })
  const ws = useRef(null)

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('light');
    } else {
      root.classList.remove('light');
    }
    localStorage.setItem('cwrps_theme', theme);
  }, [theme])

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  useEffect(() => {
    // Fetch initial history
    fetch('/readings/history?limit=50')
      .then((res) => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const formatted = data.map((d) => ({
            ...d,
            time: new Date(d.timestamp).toLocaleTimeString('en-US', {
              hour12: false,
              hour: '2-digit',
              minute: '2-digit',
            }),
          }));
          setHistory(formatted);
          setLatest(data[data.length - 1]);
        }
      })
      .catch((err) => console.log('Initial history load skipped:', err.message));

    function connect() {
      const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
      ws.current = new WebSocket(`${protocol}://${window.location.host}/ws/live`)

      ws.current.onopen = () => {
        setIsConnected(true)
      }

      ws.current.onmessage = (event) => {
        const data = JSON.parse(event.data)
        const point = {
          ...data,
          time: new Date(data.timestamp).toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
          }),
        }
        setLatest(data)
        setHistory((prev) => [...prev.slice(-49), point])
      }

      ws.current.onclose = () => {
        setIsConnected(false)
        setTimeout(connect, 3000)
      }

      ws.current.onerror = () => {
        ws.current?.close()
      }
    }

    connect()
    return () => ws.current?.close()
  }, [])

  return (
    <Dashboard
      latest={latest}
      history={history}
      isConnected={isConnected}
      theme={theme}
      onToggleTheme={toggleTheme}
    />
  )
}

export default App
