import { ShoppingBag } from "lucide-react";
import { useCart } from "@/store/cart";
import { haptic } from "@/lib/telegram";

interface HeaderProps {
  onCartClick: () => void;
}

export const Header = ({ onCartClick }: HeaderProps) => {
  const totalQty = useCart((s) => s.totalQty());

  return (
    <header className="sticky top-0 z-30 px-5 pt-5 pb-3 bg-background/80 backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl gradient-hero flex items-center justify-center text-xl shadow-soft">
            🍬
          </div>
          <div>
            <div className="font-display font-bold text-lg leading-none">Sweet Leaf</div>
            <div className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              Phuket • открыто до 22:00
            </div>
          </div>
        </div>
        <button
          onClick={() => {
            haptic("light");
            onCartClick();
          }}
          className="relative w-11 h-11 rounded-2xl bg-card shadow-card flex items-center justify-center active:scale-95 transition-[var(--transition-base)]"
          aria-label="Корзина"
        >
          <ShoppingBag className="w-5 h-5 text-foreground" />
          {totalQty > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 gradient-primary text-primary-foreground text-[11px] font-bold rounded-full flex items-center justify-center shadow-glow animate-pop">
              {totalQty}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};
