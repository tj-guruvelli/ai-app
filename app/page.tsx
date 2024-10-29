"use client";

import React, { useState, useEffect, useRef } from "react";

// Custom SVG icons
const MessageSquareIcon = () => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="24"
		height="24"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
	>
		<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
	</svg>
);

const UploadIcon = () => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="24"
		height="24"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
	>
		<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
		<polyline points="17 8 12 3 7 8"></polyline>
		<line x1="12" y1="3" x2="12" y2="15"></line>
	</svg>
);

const TrashIcon = () => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="24"
		height="24"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
	>
		<polyline points="3 6 5 6 21 6"></polyline>
		<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
	</svg>
);

const SendIcon = () => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="28"
		height="28"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
	>
		<line x1="22" y1="2" x2="11" y2="13"></line>
		<polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
	</svg>
);

export default function Component() {
	const [messages, setMessages] = useState<
		Array<{ role: string; content: string }>
	>([]);
	const [input, setInput] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [useKnowledgeBase, setUseKnowledgeBase] = useState(false);
	const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
	const [activeTab, setActiveTab] = useState("converse");
	const chatContainerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (chatContainerRef.current) {
			chatContainerRef.current.scrollTop =
				chatContainerRef.current.scrollHeight;
		}
	}, [messages]);

	const fetchRelevantInfo = async (
		input: string,
		files: string[]
	): Promise<string> => {
		// This is a placeholder function. In a real application, you would implement
		// the logic to query your knowledge base here.
		console.log("Querying knowledge base with:", input, files);
		return "Relevant information from the knowledge base would be returned here.";
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!input.trim()) return;

		setIsLoading(true);
		setMessages((prev) => [...prev, { role: "user", content: input }]);
		setInput("");

		try {
			let context = "";
			if (useKnowledgeBase) {
				const relevantInfo = await fetchRelevantInfo(input, uploadedFiles);
				context = `Relevant information: ${relevantInfo}\n\n`;
			}

			const response = await fetch(
				"http://localhost:8000/v1/chat/completions",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						model: "meta/llama-3.1-8b-instruct",
						messages: [
							{ role: "system", content: context },
							...messages,
							{ role: "user", content: input },
						],
						max_tokens: 1024,
					}),
				}
			);

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const data = await response.json();
			const assistantMessage = data.choices[0].message.content;
			setMessages((prev) => [
				...prev,
				{ role: "assistant", content: assistantMessage },
			]);
		} catch (error) {
			console.error("Error:", error);
			setMessages((prev) => [
				...prev,
				{
					role: "assistant",
					content: "Sorry, there was an error processing your request.",
				},
			]);
		} finally {
			setIsLoading(false);
		}
	};

	const handleFileUpload = async (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		const files = event.target.files;
		if (!files) return;

		const formData = new FormData();
		for (let i = 0; i < files.length; i++) {
			formData.append("files", files[i]);
		}

		try {
			const response = await fetch("/api/upload", {
				method: "POST",
				body: formData,
			});
			const data = await response.json();
			if (data.success) {
				setUploadedFiles((prev) => [...prev, ...data.uploadedFiles]);
			} else {
				console.error("File upload failed:", data.message);
			}
		} catch (error) {
			console.error("Error uploading file:", error);
		}
	};

	const handleFileDelete = async (fileName: string) => {
		try {
			const response = await fetch(
				`/api/delete/${encodeURIComponent(fileName)}`,
				{
					method: "DELETE",
				}
			);
			const data = await response.json();
			if (data.success) {
				setUploadedFiles((prev) => prev.filter((file) => file !== fileName));
			} else {
				console.error("File deletion failed:", data.message);
			}
		} catch (error) {
			console.error("Error deleting file:", error);
		}
	};

	return (
		<div className="flex flex-col h-screen bg-black text-white">
			<header className="bg-[#76B900] p-4">
				<h1 className="text-2xl font-bold text-white">Clemson Virtual TA</h1>
			</header>
			<main className="flex-grow p-4">
				<div className="w-full max-w-4xl mx-auto">
					<div className="flex mb-4 bg-gray-800 rounded-t-lg overflow-hidden">
						<button
							className={`flex-1 py-3 px-4 text-center ${
								activeTab === "converse"
									? "bg-[#76B900] text-white"
									: "bg-gray-800 text-gray-300 hover:bg-gray-700"
							}`}
							onClick={() => setActiveTab("converse")}
						>
							Converse
						</button>
						<button
							className={`flex-1 py-3 px-4 text-center ${
								activeTab === "knowledge-base"
									? "bg-[#76B900] text-white"
									: "bg-gray-800 text-gray-300 hover:bg-gray-700"
							}`}
							onClick={() => setActiveTab("knowledge-base")}
						>
							Knowledge Base
						</button>
					</div>
					{activeTab === "converse" ? (
						<div className="bg-gray-900 rounded-b-lg shadow-lg p-6">
							<div className="flex items-center mb-4">
								<MessageSquareIcon />
								<h2 className="text-xl font-semibold ml-2 text-gray-200">
									Chat
								</h2>
							</div>
							<div
								className="h-[calc(100vh-16rem)] overflow-auto mb-4 bg-gray-800 p-4 rounded-lg"
								ref={chatContainerRef}
							>
								{messages.map((message, index) => (
									<div
										key={index}
										className={`mb-4 ${
											message.role === "user" ? "text-right" : "text-left"
										}`}
									>
										<span
											className={`inline-block p-3 rounded-lg ${
												message.role === "user"
													? "bg-[#76B900] text-white"
													: "bg-gray-700 text-gray-200"
											}`}
										>
											{message.content}
										</span>
									</div>
								))}
							</div>
							<form onSubmit={handleSubmit} className="flex items-center">
								<div className="relative flex-grow">
									<textarea
										className="w-full bg-gray-800 border border-gray-700 rounded-l-lg py-3 px-4 pr-10 focus:outline-none focus:ring-2 focus:ring-[#76B900] focus:border-transparent text-white"
										placeholder="Enter text and press ENTER"
										value={input}
										onChange={(e) => setInput(e.target.value)}
										onKeyDown={(e) => {
											if (e.key === "Enter" && !e.shiftKey) {
												e.preventDefault();
												handleSubmit(e);
											}
										}}
										disabled={isLoading}
										rows={1}
										style={{ resize: "none" }}
									/>
								</div>
								<button
									type="submit"
									className="bg-[#76B900] text-white p-3 rounded-r-lg hover:bg-[#5a8f00] focus:outline-none focus:ring-2 focus:ring-[#76B900] focus:ring-offset-2 focus:ring-offset-gray-900"
									disabled={isLoading}
								>
									<SendIcon />
								</button>
							</form>
							<div className="mt-4 flex items-center space-x-2">
								<label className="inline-flex items-center cursor-pointer">
									<input
										type="checkbox"
										checked={useKnowledgeBase}
										onChange={() => setUseKnowledgeBase(!useKnowledgeBase)}
										className="sr-only peer"
									/>
									<div className="relative w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#76B900] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#76B900]"></div>
									<span className="ml-3 text-sm font-medium text-gray-300">
										Use knowledge base
									</span>
								</label>
							</div>
						</div>
					) : (
						<div className="bg-gray-900 rounded-b-lg shadow-lg p-6">
							<div className="flex items-center mb-4">
								<UploadIcon />
								<h2 className="text-xl font-semibold ml-2 text-gray-200">
									Knowledge Base Management
								</h2>
							</div>
							<input
								type="file"
								onChange={handleFileUpload}
								accept=".pdf,.txt,.doc,.docx"
								multiple
								className="mb-4 p-2 w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#76B900] file:text-white hover:file:bg-[#5a8f00]"
							/>
							<div className="space-y-2">
								{uploadedFiles.map((file, index) => (
									<div
										key={index}
										className="flex justify-between items-center bg-gray-800 p-3 rounded"
									>
										<span className="text-gray-300">{file}</span>
										<button
											onClick={() => handleFileDelete(file)}
											className="text-red-500 hover:text-red-700 focus:outline-none"
										>
											<TrashIcon />
										</button>
									</div>
								))}
							</div>
						</div>
					)}
				</div>
			</main>
			<footer className="text-sm text-center py-2 text-white bg-[#76B900] font-semibold">
				Powered by NVIDIA
			</footer>
		</div>
	);
}
