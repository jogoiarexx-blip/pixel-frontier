import ErrorBoundary from "./components/ErrorBoundary";
import GameCanvas from "./components/GameCanvas";

// Fronteira de Cobre: a rota inteira é a moldura para a missão arcade.
export default function App() {
  return (
    <ErrorBoundary>
      <GameCanvas />
    </ErrorBoundary>
  );
}
