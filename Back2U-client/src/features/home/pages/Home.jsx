//Share button added by Nusrat

import { useRef } from "react";
import ShareActions from "../../post_sharing/components/ShareActions";
import MiniFlyer from "../../post_sharing/components/MiniFlyer";


const demoItem = {
    _id: "demo123",
    title: "Black Leather Wallet",
    category: "Accessories",
    status: "Open",
    photoUrl: "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=1200",
    date: "2025-11-10T09:00:00Z"
}; // share button

export default function Home() {
    const flyerRef = useRef(null);
    return (
        <div className='min-h-[calc(100vh-16.325rem)]'>
            <p className='py-32 text-center'>analytics here</p>
            <ShareActions item={demoItem} flyerRef={flyerRef} />
            <MiniFlyer ref={flyerRef} item={demoItem} />
        </div>
    );
}