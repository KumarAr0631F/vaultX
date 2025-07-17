import HeaderBox from '@/components/HeaderBox'
import TotalBalanceBox from '@/components/TotalBalanceBox';
import React from 'react'

const Home = () => {
  const loggedIn = {firstName: 'Nitin'};

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
         
      </div>
    </section>
  )
}

export default Home