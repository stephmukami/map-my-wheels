
import 'mapbox-gl/dist/mapbox-gl.css';
import './App.css'
import Footer from './components/Footer';
import Navbar from './components/Navbar';
import MapBody from './components/MapBody';

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

function App() {
return(
  <QueryClientProvider client={queryClient}>
  <>
  <Navbar/>
    <MapBody/>
    <Footer/>
  </>
    
   </QueryClientProvider>
)

}

export default App