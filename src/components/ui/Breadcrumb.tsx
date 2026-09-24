import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from './Icon';

export interface Miga {
  label: string;
  to?: string;
}

export function Breadcrumb({ items }: { items: Miga[] }) {
  return (
    <nav className="crumb" aria-label="Ubicación">
      {items.map((item, i) => (
        <Fragment key={`${item.label}-${i}`}>
          {i > 0 && <Icon name="chevRight" size={14} className="crumb-sep" />}
          {item.to ? <Link to={item.to}>{item.label}</Link> : <span className="crumb-now" aria-current="page">{item.label}</span>}
        </Fragment>
      ))}
    </nav>
  );
}
