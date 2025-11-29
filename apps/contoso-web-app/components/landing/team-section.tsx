import { Code, Terminal, Database, Cloud } from "lucide-react";

export function TeamSection() {
  return (
    <section id="team" className="w-full py-12 md:py-24 lg:py-32">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">
              The Fantastic Four
            </h2>
            <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Microsoft Solution Engineers driving the future of DevTools.
            </p>
          </div>
        </div>
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { name: "Chris", role: "Solution Engineer", icon: Terminal },
            { name: "Ricardo", role: "Solution Engineer", icon: Database },
            { name: "Mehdi", role: "Solution Engineer", icon: Cloud },
            { name: "Ve", role: "Solution Engineer", icon: Code },
          ].map((member) => (
            <div
              key={member.name}
              className="flex flex-col items-center space-y-4 rounded-lg border p-6 shadow-sm transition-all hover:shadow-md"
            >
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary">
                <member.icon className="h-10 w-10 text-secondary-foreground" />
              </div>
              <div className="space-y-1 text-center">
                <h3 className="text-xl font-bold">{member.name}</h3>
                <p className="text-sm text-muted-foreground">{member.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
