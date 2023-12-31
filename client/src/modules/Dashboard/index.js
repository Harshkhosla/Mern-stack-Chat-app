import { useEffect, useRef, useState } from 'react'
import Img1 from '../../assets/img1.jpg'
import tutorialsdev from '../../assets/img6.jpg'
import Input from '../../components/Input'
import { io } from 'socket.io-client'

const Dashboard = () => {
	const [user, setUser] = useState(JSON.parse(localStorage.getItem('user:detail')))
	const [conversations, setConversations] = useState([])
	const [messages, setMessages] = useState({})
	const [message, setMessage] = useState('')
	const [users, setUsers] = useState([])
	const [socket, setSocket] = useState(null)
	// const [imageFile, setImageFile] = useState(null);
	const [imageFile, setImageFile] = useState(null);

	const handleFileChange = (e) => {
        const file = e.target.files[0];
        setImageFile(file);
        // setFileInputVisible(false);
        console.log('Selected File:', file);
    };
	const messageRef = useRef(null)
	const fileInputRef = useRef(null);
	useEffect(() => {
		setSocket(io('http://localhost:8080'))
	}, [])
	
	useEffect(() => {
		socket?.emit('addUser', user?.id);
		socket?.on('getUsers', users => {
			console.log('activeUsers :>> ', users);
		})
		socket?.on('getMessage', data => {
			setMessages(prev => ({
				...prev,
				messages: [...prev.messages, { user: data.user, message: data.message }]
			}))
		})
	}, [socket])
	const handleFileClick = () => {
        fileInputRef.current.click();
    };
	useEffect(() => {
		messageRef?.current?.scrollIntoView({ behavior: 'smooth' })
	}, [messages?.messages])

	useEffect(() => {
		const loggedInUser = JSON.parse(localStorage.getItem('user:detail'))
		const fetchConversations = async () => {
			const res = await fetch(`http://localhost:8000/api/conversations/${loggedInUser?.id}`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
				}
			});
			const resData = await res.json()
			setConversations(resData)
		}
		fetchConversations()
	}, [])

	useEffect(() => {
		const fetchUsers = async () => {
			const res = await fetch(`http://localhost:8000/api/users/${user?.id}`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
				}
			});
			const resData = await res.json()
			setUsers(resData)
		}
		fetchUsers()
	}, [])

	// const handleFileChange = (e) => {
    //     // Handle file change logic here
    //     const file = e.target.files[0];
	// 	setImageFile(file);
    //     // You can perform additional logic like uploading the file
    //     console.log('Selected File:', file);
    // };

	const fetchMessages = async (conversationId, receiver) => {
		const res = await fetch(`http://localhost:8000/api/message/${conversationId}?senderId=${user?.id}&&receiverId=${receiver?.receiverId}`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
			}
		});
		const resData = await res.json()
		setMessages({ messages: resData, receiver, conversationId })
	}

	const setActiveStatus = async (active) => {
        try {
            const response = await fetch('http://localhost:8000/api/set-active-status', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: localStorage.getItem('user:token'), // Assuming you store the user token in localStorage
                },
                body: JSON.stringify({ active }),
            });

            if (response.ok) {
                console.log(`Active status set to ${active}`);
                // You can update the user state or perform any other actions upon successful status update
            } else {
                console.error('Failed to set active status');
            }
        } catch (error) {
            console.error('Error setting active status:', error);
        }
    };

	const [userData, setUserData] = useState(null);
    const userId = '6571ddd165dbd769de9be0d9'; // Replace with the actual user ID

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await fetch(`http://localhost:8000/api/user/${userId}`);
                const data = await response.json();

                if (data.success) {
                    setUserData(data.user);
                } else {
                    console.error('Error fetching user details:', data.message);
                }
            } catch (error) {
                console.error('Error fetching user details:', error);
            }
        };

        fetchUserData();
    }, [userId]);
	
	const handlePhoneIconClick = async () => {
        // Toggle the active status
        const isActive = !user.active;

        try {
            // Call the API to update the active status
            const response = await fetch(`http://localhost:8000/api/updateActiveStatus/${user?.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ active: isActive }),
            });

            if (response.ok) {
                // Update the local user state if API call is successful
                setUser(prevUser => ({ ...prevUser, active: isActive }));
                socket?.emit('updateActiveStatus', { userId: user?.id, isActive });
            } else {
                console.error('Failed to update active status via API');
            }
        } catch (error) {
            console.error('Error updating active status via API:', error);
        }
    };

	useEffect(() => {
        // Set active status to true when component mounts
        setActiveStatus(true);

        // Clean up function to set active status to false when component unmounts
        return () => setActiveStatus(false);
    }, []);
	const sendMessage = async (e) => {
		setMessage('');
		console.log('Sending message via WebSocket');
		socket?.emit('sendMessage', {
		  senderId: user?.id,
		  receiverId: messages?.receiver?.receiverId,
		  message,
		  conversationId: messages?.conversationId
		});
	  
		console.log('Sending message via POST request');
		const res = await fetch(`http://localhost:8000/api/message`, {
		  method: 'POST',
		  headers: {
			'Content-Type': 'application/json',
		  },
		  body: JSON.stringify({
			conversationId: messages?.conversationId,
			senderId: user?.id,
			message,
			receiverId: messages?.receiver?.receiverId
		  })
		});
	  
		if (res.ok) {
		  console.log('Message sent successfully via POST');
		} else {
		  console.error('Failed to send message via POST');
		}
	  };
	  

	return (
		<div className='w-screen flex'>
			<div className='w-[25%] h-screen bg-secondary overflow-scroll'>
				<div className='flex items-center my-8 mx-14'>
					<div><img src={tutorialsdev} width={75} height={75} className='border border-primary p-[2px] rounded-full' /></div>
					<div className='ml-8'>
						<h3 className='text-2xl'>{user?.fullName}</h3>
						<p className='text-lg font-light' onClick={() => handlePhoneIconClick()}>
                {user?.active ? 'Active' : 'Inactive'}
            </p>
					</div>
				</div>
				<hr />
				<div className='mx-14 mt-10'>
					<div className='text-primary text-lg' >Messages</div>
					<div>
						{
							conversations.length > 0 ?
								conversations.map(({ conversationId, user }) => {
									return (
										<div className='flex items-center py-8 border-b border-b-gray-300'>
											<div className='cursor-pointer flex items-center' onClick={() => fetchMessages(conversationId, user)}>
												<div><img src={Img1} className="w-[60px] h-[60px] rounded-full p-[2px] border border-primary" /></div>
												<div className='ml-6'>
													<h3 className='text-lg font-semibold'>{user?.fullName}</h3>
													<p className='text-sm font-light text-gray-600'>{user?.email}</p>
												</div>
											</div>
										</div>
									)
								}) : <div className='text-center text-lg font-semibold mt-24'>No Conversations</div>
						}
					</div>
				</div>
			</div>
			<div className='w-[50%] h-screen bg-white flex flex-col items-center'>
				{
					messages?.receiver?.fullName &&
					<div className='w-[75%] bg-secondary h-[80px] my-14 rounded-full flex items-center px-14 py-2'>
						<div className='cursor-pointer'><img src={Img1} width={60} height={60} className="rounded-full" /></div>
						<div className='ml-6 mr-auto'>
							<h3 className='text-lg'>{messages?.receiver?.fullName}</h3>
							<p className='text-sm font-light text-gray-600'>{messages?.receiver?.email}</p>
						</div>
						<div className='cursor-pointer' onClick={() => handlePhoneIconClick()}>
                <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-phone-outgoing" width="24" height="24" viewBox="0 0 24 24" strokeWidth="1.5" stroke="black" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                    <path d="M5 4h4l2 5l-2.5 1.5a11 11 0 0 0 5 5l1.5 -2.5l5 2v4a2 2 0 0 1 -2 2a16 16 0 0 1 -15 -15a2 2 0 0 1 2 -2" />
                    <line x1="15" y1="9" x2="20" y2="4" />
                    <polyline points="16 4 20 4 20 8" />
                </svg>
            </div>
					</div>
				}
				<div className='h-[75%] w-full overflow-scroll shadow-sm'>
					<div className='p-14'>
						{
							messages?.messages?.length > 0 ?
								messages.messages.map(({ message, user: { id } = {} }) => {
									return (
										<>
										<div className={`max-w-[40%] rounded-b-xl p-4 mb-6 ${id === user?.id ? 'bg-primary text-white rounded-tl-xl ml-auto' : 'bg-secondary rounded-tr-xl'} `}>{message}</div>
										<div ref={messageRef}></div>
										</>
									)
								}) : <div className='text-center text-lg font-semibold mt-24'>No Messages or No Conversation Selected</div>
						}
					</div>
				</div>
				{
					messages?.receiver?.fullName &&
					<div className='p-14 w-full flex items-center'>
						<Input placeholder='Type a message...' value={message} onChange={(e) => setMessage(e.target.value)} className='w-[75%]' inputClassName='p-4 border-0 shadow-md rounded-full bg-light focus:ring-0 focus:border-0 outline-none' />
						<div className={`ml-4 p-2 cursor-pointer bg-light rounded-full ${!message && 'pointer-events-none'}`} onClick={() => sendMessage()}>
							<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-send" width="30" height="30" viewBox="0 0 24 24" stroke-width="1.5" stroke="#2c3e50" fill="none" stroke-linecap="round" stroke-linejoin="round">
								<path stroke="none" d="M0 0h24v24H0z" fill="none" />
								<line x1="10" y1="14" x2="21" y2="3" />
								<path d="M21 3l-6.5 18a0.55 .55 0 0 1 -1 0l-3.5 -7l-7 -3.5a0.55 .55 0 0 1 0 -1l18 -6.5" />
							</svg>
						</div>
					
						<div className={`ml-4 p-2 cursor-pointer bg-light rounded-full ${!message && 'pointer-events-none'}`}>
							
						<input
                    type='file'
                    accept='image/*'
                    onChange={handleFileChange}
                    className='hidden'
                    ref={fileInputRef}
                />
                {/* SVG for triggering file input */}
                <label htmlFor="fileInput" className="cursor-pointer" onClick={handleFileClick}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-circle-plus" width="30" height="30" viewBox="0 0 24 24" strokeWidth="1.5" stroke="#2c3e50" fill="none" strokeLinecap="round" strokeLinejoin="round">
                        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                        <circle cx="12" cy="12" r="9" />
                        <line x1="9" y1="12" x2="15" y2="12" />
                        <line x1="12" y1="9" x2="12" y2="15" />
                    </svg>
                </label>
						</div>
					</div>
				}
			</div>
			<div className='w-[25%] h-screen bg-light px-8 py-16 overflow-scroll'>
				<div className='text-primary text-lg'>People</div>
				<div>
					{
						users.length > 0 ?
							users.map(({ userId, user }) => {
								return (
									<div className='flex items-center py-8 border-b border-b-gray-300'>
										<div className='cursor-pointer flex items-center' onClick={() => fetchMessages('new', user)}>
											<div><img src={Img1} className="w-[60px] h-[60px] rounded-full p-[2px] border border-primary" /></div>
											<div className='ml-6'>
												<h3 className='text-lg font-semibold'>{user?.fullName}</h3>
												<p className='text-sm font-light text-gray-600'>{user?.email}</p>
											</div>
										</div>
									</div>
								)
							}) : <div className='text-center text-lg font-semibold mt-24'>No Conversations</div>
					}
				</div>
			</div>
		</div>
	)
}

export default Dashboard