"use client";

import { useState, useTransition } from "react";
import { saveSelectedInstagramAccount } from "@/app/actions";
import type { InstagramAccountOption } from "@/app/select-account/page";

interface Props {
  accounts: InstagramAccountOption[];
}

function formatFollowers(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toString();
}

export default function AccountSelector({ accounts }: Props) {
  const [selected, setSelected] = useState<string | null>(
    accounts.length === 1 ? accounts[0].igId : null
  );
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const selectedAccount = accounts.find((a) => a.igId === selected);

  const handleConnect = () => {
    if (!selectedAccount) return;
    setError(null);

    startTransition(async () => {
      try {
        await saveSelectedInstagramAccount(
          selectedAccount.igId,
          selectedAccount.igUsername,
          selectedAccount.igFollowers,
          selectedAccount.pageAccessToken
        );
      } catch (err: any) {
        setError(err.message || "Something went wrong. Please try again.");
      }
    });
  };

  if (accounts.length === 0) {
    return (
      <div className="text-center py-6">
        <svg
          className="w-12 h-12 mx-auto text-zinc-600 mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <p className="text-zinc-400 text-sm">No Instagram accounts found.</p>
        <p className="text-zinc-600 text-xs mt-1">
          Connect your Instagram to a Facebook Page first.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-zinc-400 mb-1">
        We found {accounts.length} Instagram account
        {accounts.length > 1 ? "s" : ""} connected to your Facebook. Select the
        one you want to track.
      </p>

      <div className="flex flex-col gap-3">
        {accounts.map((account) => {
          const isSelected = selected === account.igId;
          return (
            <button
              key={account.igId}
              onClick={() => setSelected(account.igId)}
              className={`flex items-center gap-4 w-full p-4 rounded-xl border text-left transition-all duration-200 ${
                isSelected
                  ? "border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/10"
                  : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8"
              }`}
            >
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                {account.igPicture ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={account.igPicture}
                    alt={account.igUsername}
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-white/10"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-orange-400 flex items-center justify-center text-white font-bold text-lg">
                    {account.igUsername.charAt(0).toUpperCase()}
                  </div>
                )}
                {isSelected && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                    <svg
                      className="w-3 h-3 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white truncate">
                    @{account.igUsername}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-pink-500/20 text-pink-300 font-medium flex-shrink-0">
                    Instagram
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-xs text-zinc-400">
                    {formatFollowers(account.igFollowers)} followers
                  </span>
                  <span className="text-zinc-600">·</span>
                  <span className="text-xs text-zinc-500 truncate">
                    via {account.pageName}
                  </span>
                </div>
              </div>

              {/* Radio indicator */}
              <div
                className={`w-5 h-5 rounded-full border-2 flex-shrink-0 transition-colors ${
                  isSelected ? "border-blue-500 bg-blue-500" : "border-zinc-600"
                }`}
              >
                {isSelected && (
                  <div className="w-full h-full rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-white" />
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {error && (
        <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
          {error}
        </p>
      )}

      <button
        onClick={handleConnect}
        disabled={!selected || isPending}
        className="mt-2 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold py-3 px-6 rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/25"
      >
        {isPending ? (
          <>
            <svg
              className="w-4 h-4 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Syncing your data...
          </>
        ) : (
          <>
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            Connect & Go to Dashboard
          </>
        )}
      </button>

      <p className="text-center text-xs text-zinc-600 mt-1">
        We only read your analytics. We never post on your behalf.
      </p>
    </div>
  );
}
