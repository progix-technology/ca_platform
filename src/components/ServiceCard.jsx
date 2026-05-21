import { ArrowRight, Clock, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from './Button';

export default function ServiceCard({ service }) {
  const navigate = useNavigate();
  const serviceId = service.id || service._id;

  return (
    <div className="service-card" onClick={() => navigate(`/service/${serviceId}`)}>
      <div className="service-card__header">
        <div className="service-card__icon">
          {service.icon}
        </div>
        <div className="service-card__badges">
          {service.popular && (
            <span className="service-card__badge service-card__badge--popular">
              <Star size={10} fill="currentColor" /> Popular
            </span>
          )}
          <span className="service-card__badge service-card__badge--category">{service.category}</span>
        </div>
      </div>

      <h3 className="service-card__title">{service.title}</h3>
      <p className="service-card__description">{service.description}</p>

      <div className="service-card__duration">
        <Clock size={12} />
        <span>{service.duration}</span>
      </div>

      <div className="service-card__footer">
        <div className="service-card__price-wrap">
          <span className="service-card__price-label">Starting at</span>
          <div className="service-card__price-value">
            ₹{service.price.toLocaleString('en-IN')}
          </div>
        </div>
        <Button variant="primary" size="sm" className="service-card__cta">
          Apply <ArrowRight size={14} />
        </Button>
      </div>
    </div>
  );
}
