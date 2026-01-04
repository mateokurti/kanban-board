import "./globals.css";
import Providers from "./providers";

export const metadata = {
  title: "Kanban Task Manager",
  description: "A simple task management app with authentication",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en"> 
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
