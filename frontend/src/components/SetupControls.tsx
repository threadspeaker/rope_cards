type SetupControlsParameters = {
    onFlip: () => void;
    onKeep: () => void;
    keepMode: boolean;

}

export const SetupControls = ({
    onFlip,
    onKeep,
    keepMode
}: SetupControlsParameters) => {
    return (
        <>
            <div className="flex justify-center gap-4">
                <button
                    className={`px-4 py-2 rounded ${!keepMode ? 'bg-green-500 text-white' : 'bg-gray-300'}`}
                    disabled={keepMode}
                    onClick={onFlip}
                >
                    Invert
                </button>
                <button
                    className={`px-4 py-2 rounded ${!keepMode ? 'bg-green-500 text-white' : 'bg-gray-300'}`}
                    disabled={keepMode}
                    onClick={onKeep}
                >
                    Keep
                </button>
            </div>
        </>
    );
};