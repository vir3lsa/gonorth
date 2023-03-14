/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UserEvent } from "@testing-library/user-event/dist/types/setup/setup";
import "@testing-library/jest-dom";
import Feedback from "./Feedback";

describe("Feedback component", () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
    render(<Feedback />);
  });

  test("is rendered", async () => {
    await screen.findByText("Feedback");
  });

  test("opens when the button is clicked", async () => {
    const button = await screen.findByText("Feedback");
    await user.click(button);
    await screen.findByText("Spotted a bug?", { exact: false });
  });

  test("initially disables the submit button", async () => {
    const button = await screen.findByText("Feedback");
    await user.click(button);
    const submit = await screen.findByText("Submit");
    expect(submit).toBeDisabled();
  });

  test("enables the submit button when text is entered", async () => {
    const button = await screen.findByText("Feedback");
    await user.click(button);
    const submit = await screen.findByText("Submit");
    const message = await screen.findByPlaceholderText("I saw a bug when...");
    await user.type(message, "playing");
    expect(submit).not.toBeDisabled();
  });
});
