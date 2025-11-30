import { useState } from "react"
import { toast } from "sonner";

function useFetch<TArgs extends unknown[], TData>(cb: (...args: TArgs) => Promise<TData>) {
    const [data, setData] = useState<TData | undefined>(undefined);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<unknown>(null);

    const fn = async (...args: TArgs) => {
        setLoading(true);
        setError(null);

        try {
            const response = await cb(...args);
            setData(response);
            setError(null);
        } catch (error) {
            setError(error);
            toast.error((error as Error).message);
        } finally {
            setLoading(false);
        }
    }

    return { data, loading, error, fn, setData };
}

export default useFetch;