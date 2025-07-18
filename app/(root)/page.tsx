import HeaderBox from '@/components/HeaderBox'
import RightSidebar from '@/components/RightSidebar';
import TotalBalanceBox from '@/components/TotalBalanceBox';
import React from 'react'

const Home = () => {
  const loggedIn = {firstName: 'Nitin', lastName: 'Kumar', email: "nitin.kumar132005@gmail.com"};

  return (
    <section className="home">
      <div className='home-content'>
        <header className='home-header'>
          <HeaderBox 
            type="greeting"
            title="Welcome"
            user={loggedIn?.firstName || 'Guest'}
            subtext="Access your manage your account and transactions efficiently."
          />

          <TotalBalanceBox accounts={[]} totalBanks={1} totalCurrentBalance={1500.35}/>
        </header>

        RECENT TRANSACTION
         
      </div>

      <RightSidebar user={loggedIn} transactions={[]} banks={[{currentBalance: 1500.50}, {currentBalance: 2000.75}]} />
    </section>
  )
}

export default Home