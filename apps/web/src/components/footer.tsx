import Link from 'next/link';

export function Footer() {
  return (
    <footer className="mt-16 border-t border-charcoal-700/10 bg-forest-900 text-cream-100">
      <div className="container-page grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <span className="text-lg font-black">OasisA2</span>
          <p className="mt-2 text-sm text-cream-100/70">
            Fresh. Halal. Local. Halal groceries, fresh butcher service, and South Asian &
            Middle Eastern essentials — ready for pickup or local delivery.
          </p>
        </div>
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide text-cream-100/60">Shop</h3>
          <ul className="mt-2 space-y-1 text-sm">
            <li><Link href="/departments" className="hover:underline">All Departments</Link></li>
            <li><Link href="/d/meat-poultry" className="hover:underline">Halal Meat</Link></li>
            <li><Link href="/d/produce" className="hover:underline">Fresh Produce</Link></li>
            <li><Link href="/specials" className="hover:underline">Weekly Specials</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide text-cream-100/60">Branches</h3>
          <ul className="mt-2 space-y-1 text-sm">
            <li><Link href="/locations/glen-burnie" className="hover:underline">Glen Burnie</Link></li>
            <li><Link href="/locations/fredericksburg" className="hover:underline">Fredericksburg</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide text-cream-100/60">Account</h3>
          <ul className="mt-2 space-y-1 text-sm">
            <li><Link href="/account" className="hover:underline">My Account</Link></li>
            <li><Link href="/account/orders" className="hover:underline">Order History</Link></li>
            <li><Link href="/account/lists" className="hover:underline">Saved Lists</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-cream-100/10 py-4 text-center text-xs text-cream-100/50">
        Demo build · sample catalog &amp; prices · store details are placeholders pending
        confirmation by OasisA2 staff.
      </div>
    </footer>
  );
}
