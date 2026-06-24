import { describe, expect, it, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { PROFILE_STORAGE_KEY } from "@/domain/config/defaults";
import { LineItem } from "@/domain/model/LineItem";

import { ProfileProvider } from "../ProfileProvider";
import { useProfile } from "../useProfile";

function TestConsumer() {
  const { profile, isLoaded, addItem, removeItem, updateItem, updateAssets } = useProfile();

  return (
    <div>
      <span data-testid="loaded">{String(isLoaded)}</span>
      <span data-testid="item-count">{profile.items.length}</span>
      <span data-testid="savings">{profile.assets.savings}</span>
      <button
        onClick={() =>
          addItem(
            LineItem.create({
              id: "income-1",
              category: "income",
              subCategory: "salary",
              label: "Salary",
              changes: [{ effectiveFrom: profile.startMonth, amount: 35000 }],
            }),
          )
        }
      >
        add
      </button>
      <button onClick={() => removeItem("income-1")}>remove</button>
      <button
        onClick={() =>
          updateItem(
            "income-1",
            LineItem.create({
              id: "income-1",
              category: "income",
              subCategory: "salary",
              label: "Salary",
              changes: [{ effectiveFrom: profile.startMonth, amount: 45000 }],
            }),
          )
        }
      >
        update
      </button>
      <button onClick={() => updateAssets({ savings: 99999 })}>save-assets</button>
    </div>
  );
}

describe("ProfileProvider / useProfile", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("throws when useProfile is used outside a ProfileProvider", () => {
    function Bare() {
      useProfile();
      return null;
    }

    expect(() => render(<Bare />)).toThrow("useProfile must be used within a <ProfileProvider>.");
  });

  it("starts loaded with an empty profile when nothing is stored", () => {
    render(
      <ProfileProvider>
        <TestConsumer />
      </ProfileProvider>,
    );

    expect(screen.getByTestId("loaded").textContent).toBe("true");
    expect(screen.getByTestId("item-count").textContent).toBe("0");
    expect(screen.getByTestId("savings").textContent).toBe("0");
  });

  it("loads a previously saved profile from localStorage on mount", () => {
    localStorage.setItem(
      PROFILE_STORAGE_KEY,
      JSON.stringify({
        items: [
          {
            id: "income-1",
            category: "income",
            subCategory: "salary",
            label: "Salary",
            changes: [{ effectiveFrom: "2026-06", amount: 35000 }],
          },
        ],
        assets: { savings: 12345 },
        startMonth: "2026-06",
        meta: { updatedAt: "2026-06-01T00:00:00.000Z" },
      }),
    );

    render(
      <ProfileProvider>
        <TestConsumer />
      </ProfileProvider>,
    );

    expect(screen.getByTestId("item-count").textContent).toBe("1");
    expect(screen.getByTestId("savings").textContent).toBe("12345");
  });

  it("addItem updates state and persists to localStorage", async () => {
    render(
      <ProfileProvider>
        <TestConsumer />
      </ProfileProvider>,
    );

    await userEvent.click(screen.getByRole("button", { name: "add" }));

    expect(screen.getByTestId("item-count").textContent).toBe("1");
    await waitFor(() => {
      const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
      expect(raw).not.toBeNull();
      expect(JSON.parse(raw!).items).toHaveLength(1);
    });
  });

  it("removeItem and updateItem mutate the profile via context", async () => {
    render(
      <ProfileProvider>
        <TestConsumer />
      </ProfileProvider>,
    );

    await userEvent.click(screen.getByRole("button", { name: "add" }));
    expect(screen.getByTestId("item-count").textContent).toBe("1");

    await userEvent.click(screen.getByRole("button", { name: "update" }));
    expect(screen.getByTestId("item-count").textContent).toBe("1");

    await userEvent.click(screen.getByRole("button", { name: "remove" }));
    expect(screen.getByTestId("item-count").textContent).toBe("0");
  });

  it("updateAssets persists the new savings value", async () => {
    render(
      <ProfileProvider>
        <TestConsumer />
      </ProfileProvider>,
    );

    await userEvent.click(screen.getByRole("button", { name: "save-assets" }));

    expect(screen.getByTestId("savings").textContent).toBe("99999");
  });
});
