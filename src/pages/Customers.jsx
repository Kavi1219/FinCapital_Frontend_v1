import { useParams } from "react-router";
export default function Customers() {
  const { cycle = "all" } = useParams();
  return (
    <section className="panel">
      <h1>{cycle[0].toUpperCase() + cycle.slice(1)} Customers</h1>
      <p className="muted">
        Customer list will connect to Spring Boot API later.
      </p>
    </section>
  );
}
