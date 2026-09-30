import { RotateCw } from "lucide-react";
import Alert from "./Alert.jsx";
import Button from "./Button.jsx";
import { errorMessage } from "../../utils/errors.js";

export default function LoadError({ error, onRetry, message = "We couldn't load this content." }) {
  return (
    <Alert tone="error" className="items-center">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span>
          {message} {errorMessage(error, "")}
        </span>
        {onRetry && (
          <Button type="button" variant="secondary" className="min-h-9 py-1" onClick={onRetry}>
            <RotateCw className="h-4 w-4" />
            Retry
          </Button>
        )}
      </div>
    </Alert>
  );
}
