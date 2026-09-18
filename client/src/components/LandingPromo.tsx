import { Link } from "react-router-dom";
import { ListChecks, Users, TrendingUp } from "lucide-react";
import { BrandLogo } from "./BrandLogo";
import "../pages/LandingPage.css";

// Shared with the original workspace entry to preserve the team’s landing design.
export function LandingPromo() {
 return (<section className="landing-promo">
        <Link to="/" className="landing-brand" aria-label="NEO home">
          <BrandLogo tone="on-dark" />
        </Link>

        <div className="landing-promo-content">
          <div className="landing-kicker">
            COLLABORATIVE TASK MANAGEMENT
          </div>

          <h1>
            Your team.
            <br />
            <span>One board.</span>
          </h1>

          <div className="landing-title-line" />

          <p className="landing-description">
            A collaborative task-management space for student teams
            and club committees.
          </p>
        </div>

        <div className="landing-features">
          <div className="landing-feature-card">
            <div className="landing-feature-icon">
              <ListChecks />
            </div>

            <h3>Stay organized</h3>

            <div className="landing-feature-line" />

            <p>
              Keep your team's tasks structured and easy to manage.
            </p>
          </div>

          <div className="landing-feature-card">
            <div className="landing-feature-icon">
              <Users />
            </div>

            <h3>Work together</h3>

            <div className="landing-feature-line" />

            <p>
              Collaborate with your team and keep everyone aligned.
            </p>
          </div>

          <div className="landing-feature-card">
            <div className="landing-feature-icon">
              <TrendingUp />
            </div>

            <h3>Stay on track</h3>

            <div className="landing-feature-line" />

            <p>
              Follow progress and see what needs your attention next.
            </p>
          </div>
        </div>
      </section>);
}
