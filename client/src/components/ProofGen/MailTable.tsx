import React, { useEffect, useState } from 'react';
import styled, { css } from 'styled-components/macro'
import { Mail } from 'react-feather'

import { ThemedText } from '../../theme/text';
import { Button } from '../Button';
import { AccessoryButton } from '@components/common/AccessoryButton';
import {
  fetchEmailsRaw,
  fetchVenmoEmailList,
  RawEmailResponse
} from '@hooks/useGmailClient';
import useGoogleAuth from '@hooks/useGoogleAuth';
import { MailRow } from './MailRow';


interface MailTableProps {
  setEmailFull: (emailFull: string) => void;
  handleVerifyEmailClicked: () => void;
}

export const MailTable: React.FC<MailTableProps> = ({
  setEmailFull,
  handleVerifyEmailClicked,
}) => {
  /*
   * Context
   */

  const {
    googleAuthToken,
    isGoogleAuthed,
    loggedInGmail,
    scopesApproved,
    googleLogIn,
    googleLogOut,
  } = useGoogleAuth();

  /*
   * State
   */

  const [fetchedEmails, setFetchedEmails] = useState<RawEmailResponse[]>([]);

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  /*
   * Handlers
   */
  
  const handleRowClick = (index: number) => {
    setSelectedIndex(index);

    const email = fetchedEmails[index];

    setEmailFull(email.decodedContents);
  };

  /*
   * Helpers
   */

  function formatDateTime(unixTimestamp: string): string {
    const date = new Date(Number(unixTimestamp));
    const now = new Date();
  
    const isToday = date.getDate() === now.getDate() &&
                    date.getMonth() === now.getMonth() &&
                    date.getFullYear() === now.getFullYear();
  
    if (isToday) {
      return date.toLocaleTimeString(undefined, {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } else {
      return date.toLocaleDateString(undefined, {
        month: 'numeric',
        day: 'numeric'
      });
    }
  }

  async function fetchData() {
    try {
      const emailListResponse = await fetchVenmoEmailList(googleAuthToken.access_token, {'q': 'from:venmo@venmo.com'});
      
      const emailIds = emailListResponse.messages.map(message => message.id);
      if (emailIds.length > 0) {
        const emails = await fetchEmailsRaw(googleAuthToken.access_token, emailIds);

        setFetchedEmails(emails);

        console.log('Fetched Emails:', emails);
      }
    } catch (error) {
      console.error('Error in fetching data:', error);
    }
  };

  /*
   * Hooks
   */

  useEffect(() => {
    if (googleAuthToken && scopesApproved) {
      fetchData();
    }
  }, [scopesApproved]);

  useEffect(() => {
    setSelectedIndex(null);
    setEmailFull('');
  }, [fetchedEmails]);
  
  /*
   * Component
   */

  return (
    <Container>
      {!isGoogleAuthed || fetchedEmails.length === 0 ? (
        <ErrorContainer>
          <ThemedText.DeprecatedBody textAlign="center">
            <MailIcon strokeWidth={1} style={{ marginTop: '2em' }} />
            <div>
              Your emails from Venmo will appear here.
            </div>
          </ThemedText.DeprecatedBody>
          
          <Button
            onClick={googleLogIn}
            height={48}
          >
            Sign in with Google
          </Button>
        </ErrorContainer>
      ) : (
        <LoggedInContainer>
          <TitleContainer>
            <ThemedText.SubHeader textAlign="left">
              Google Mail
            </ThemedText.SubHeader>

            <AccessoryButton
              onClick={googleLogOut}
              height={36}
              title={'Logout'}
              icon={'logout'}
            />
          </TitleContainer>

          <TitleAndTableContainer>
            <TitleAndOAuthContainer>
              <EmailAddressTitle>
                <EmailLabel>
                  <EmailLabelTitle>Logged in as:&nbsp;</EmailLabelTitle>
                  <EmailLabelValue>{loggedInGmail}</EmailLabelValue>
                </EmailLabel>
              </EmailAddressTitle>


              <AccessoryButton
                onClick={fetchData}
                height={36}
                title={'Refresh'}
                icon={'refresh'}
              />
            </TitleAndOAuthContainer>

            <Table>
              {fetchedEmails.map((email, index) => (
                <MailRow
                  key={index}
                  subjectText={email.subject}
                  dateText={formatDateTime(email.internalDate)}
                  isSelected={index === selectedIndex}
                  isLastRow={index === fetchedEmails.length - 1}
                  onRowClick={() => handleRowClick(index)}
                />
              ))}
            </Table>
          </TitleAndTableContainer>

          <ButtonContainer>
            <Button
              disabled={selectedIndex == null}
              loading={false}
              onClick={handleVerifyEmailClicked}
            >
              Verify Email
            </Button>
          </ButtonContainer>
        </LoggedInContainer>
      )}
    </Container>
  )
}

const Container = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-self: flex-start;
  justify-content: center;
  
  background-color: #0D111C;
  border: 1px solid #98a1c03d;
  border-radius: 16px;
  overflow: hidden;
`;

const ErrorContainer = styled.div`
  display: flex;
  align-items: center;
  flex-direction: column;
  justify-content: center;
  margin: auto;
  padding: 36px 0px;
  max-width: 340px;
  min-height: 25vh;
  gap: 36px;
`;

const IconStyle = css`
  width: 48px;
  height: 48px;
  margin-bottom: 0.5rem;
`;

const MailIcon = styled(Mail)`
  ${IconStyle}
`;

const LoggedInContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.5rem;
`;

const TitleContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-end;
  padding: 0px 1rem;
`;

const TitleAndTableContainer = styled.div`
  border: 1px solid #98a1c03d;
  border-radius: 8px;
  background-color: #090D14;
`;

const TitleAndOAuthContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #98a1c03d;
  padding: 1rem 1.5rem;
`;

const EmailAddressTitle = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const EmailLabel = styled.label`
  display: flex;
  font-size: 14px;
  color: #FFFFFF;
  align-items: center;
`;

const EmailLabelTitle = styled.span`
  font-size: 14px;
  color: #6C757D;
`;

const EmailLabelValue = styled.span`
  font-size: 14px;
  color: #FFFFFF;
`;

const Table = styled.div`
  width: 100%;
  box-shadow: 0px 2px 12px 0px rgba(0, 0, 0, 0.25);
  color: #616161;
`;

const ButtonContainer = styled.div`
  display: grid;
  padding-top: 1rem;
`;
