import { useState } from "react";

export default function Form() {
    const [alexName, setAlexName] = useState("");
    const [status, setStatus] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus("Submitting…");

        try {
            const res = await fetch("/api/submit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ alexName }),
            });

            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            setStatus("✅ Submitted!");
            setAlexName("");
        } catch (err) {
            console.error(err);
            setStatus("❌ Failed. See console.");
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label>Name: <input type="email" value={alexName} onChange={(e) => setAlexName(e.target.value)} required /></label>
            </div>
            <button type="submit">Submit</button>
            {status && <p>{status}</p>}
        </form>
    );
}
